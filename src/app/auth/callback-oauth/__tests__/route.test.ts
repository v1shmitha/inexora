import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const userClient = {
  auth: {
    exchangeCodeForSession: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(),
};
const adminUpdateEq = vi.fn();
const adminUpdate = vi.fn(() => ({ eq: adminUpdateEq }));
const adminState = {
  profile: null as { role: string; createdAt: string } | null,
  lookupError: false,
  roleRows: { Student: 0, Lecturer: 0, Employer: 0 } as Record<string, number>,
};
const adminFrom = vi.fn((table: string) => {
  if (table === "Profile") {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: adminState.profile,
              error: adminState.lookupError ? { message: "boom" } : null,
            }),
        }),
      }),
      update: adminUpdate,
    };
  }
  return {
    select: () => ({
      eq: () => Promise.resolve({ count: adminState.roleRows[table] ?? 0 }),
    }),
  };
});

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(userClient)),
}));
vi.mock("~/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: adminFrom })),
}));

import { GET } from "../route";

const call = (qs: string) =>
  GET(new Request(`http://localhost/auth/callback-oauth?${qs}`) as unknown as NextRequest);

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

beforeEach(() => {
  adminState.profile = { role: "STUDENT", createdAt: minutesAgo(1) };
  adminState.roleRows = { Student: 0, Lecturer: 0, Employer: 0 };
  adminState.lookupError = false;
  userClient.auth.exchangeCodeForSession.mockResolvedValue({
    data: { user: { id: "u1" } },
    error: null,
  });
  userClient.auth.updateUser.mockResolvedValue({});
  // user-session Profile read for the terms gate
  userClient.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: { termsAcceptedAt: "x" } }),
      }),
    }),
  });
});

describe("GET /auth/callback-oauth role assignment", () => {
  it("writes an allowed role via the admin client on a fresh account", async () => {
    await call("code=c&role=LECTURER");

    expect(adminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "LECTURER", isActive: true }),
    );
    expect(adminUpdateEq).toHaveBeenCalledWith("id", "u1");
    expect(userClient.auth.updateUser).toHaveBeenCalledWith({
      data: { role: "LECTURER" },
    });
  });

  describe("naive (no-Z) createdAt from PostgREST on a non-UTC server", () => {
    const originalTz = process.env.TZ;
    const naive = (msAgo: number) =>
      new Date(Date.now() - msAgo).toISOString().replace("Z", "");
    beforeEach(() => {
      process.env.TZ = "Asia/Colombo";
    });
    afterEach(() => {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    });

    it("treats a seconds-old timestamp as fresh", async () => {
      adminState.profile = { role: "STUDENT", createdAt: naive(5_000) };
      await call("code=c&role=EMPLOYER");
      expect(adminUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ role: "EMPLOYER" }),
      );
    });

    it("treats an 11-minute-old timestamp as not fresh", async () => {
      adminState.profile = { role: "STUDENT", createdAt: naive(11 * 60_000) };
      await call("code=c&role=EMPLOYER");
      expect(adminUpdate).not.toHaveBeenCalled();
    });
  });

  it("skips the role write (and still redirects) when a lookup errors", async () => {
    adminState.lookupError = true;
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await call("code=c&role=EMPLOYER&next=/dash");

    expect(adminUpdate).not.toHaveBeenCalled();
    expect(userClient.auth.updateUser).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("http://localhost/dash");
  });

  it.each(["ADMIN", "INSTITUTION"])("never writes role %s", async (role) => {
    await call(`code=c&role=${role}`);

    expect(adminUpdate).not.toHaveBeenCalled();
    expect(userClient.auth.updateUser).not.toHaveBeenCalled();
  });

  it.each(["Student", "Lecturer", "Employer"])(
    "skips the role write when a %s row already exists",
    async (table) => {
      adminState.roleRows[table] = 1;
      await call("code=c&role=EMPLOYER");

      expect(adminUpdate).not.toHaveBeenCalled();
    },
  );

  it("skips the role write when the account is older than 10 minutes", async () => {
    adminState.profile = { role: "STUDENT", createdAt: minutesAgo(11) };
    await call("code=c&role=EMPLOYER");

    expect(adminUpdate).not.toHaveBeenCalled();
    expect(userClient.auth.updateUser).not.toHaveBeenCalled();
  });

  it("skips the role write when the profile role is not STUDENT", async () => {
    adminState.profile = { role: "LECTURER", createdAt: minutesAgo(1) };
    await call("code=c&role=EMPLOYER");

    expect(adminUpdate).not.toHaveBeenCalled();
  });

  it("continues to the redirect when the role write is skipped", async () => {
    adminState.profile = { role: "STUDENT", createdAt: minutesAgo(30) };
    const res = await call("code=c&role=EMPLOYER&next=/dash");

    expect(res.headers.get("location")).toBe("http://localhost/dash");
  });

  it("redirects to /login when the code exchange fails", async () => {
    userClient.auth.exchangeCodeForSession.mockResolvedValue({
      data: { user: null },
      error: { message: "bad code" },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const res = await call("code=c&role=LECTURER");

    expect(res.headers.get("location")).toContain("/login");
    expect(adminUpdate).not.toHaveBeenCalled();
  });
});
