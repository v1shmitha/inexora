import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findUnique: vi.fn(),
  createAdminClient: vi.fn(),
  profileUpdate: vi.fn(),
  profileEq: vi.fn(),
  select: vi.fn(),
  selectEq: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("~/server/db", () => ({
  db: { profile: { findUnique: mocks.findUnique } },
}));
vi.mock("~/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { POST } from "../route";

const KEYS = { companyName: "Acme", industry: "Tech", companySize: "10-50" };

function session(role: string, id = "me", isActive = true) {
  mocks.getUser.mockResolvedValue({ data: { user: { id } } });
  mocks.findUnique.mockResolvedValue({ id, role, isActive });
}

function existingRow(over: Record<string, unknown> = {}) {
  mocks.maybeSingle.mockResolvedValue({
    data: {
      id: "emp-1",
      approvalStatus: "APPROVED",
      isVerified: true,
      ...KEYS,
      ...over,
    },
  });
}

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/profile-setup/employer", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function upserted() {
  return mocks.upsert.mock.calls[0]![0] as Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  mocks.profileEq.mockResolvedValue({ error: null });
  mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
  mocks.maybeSingle.mockResolvedValue({ data: null });
  mocks.selectEq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.select.mockReturnValue({ eq: mocks.selectEq });
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.createAdminClient.mockReturnValue({
    from: (table: string) =>
      table === "Profile"
        ? { update: mocks.profileUpdate }
        : { select: mocks.select, upsert: mocks.upsert },
  });
  session("EMPLOYER");
});

describe("POST /api/profile-setup/employer", () => {
  it("returns 401 when logged out and never builds the admin client", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const res = await call(KEYS);
    expect(res.status).toBe(401);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each(["STUDENT", "LECTURER", "INSTITUTION", "ADMIN"])(
    "returns 403 for role %s with no writes",
    async (role) => {
      session(role);
      const res = await call(KEYS);
      expect(res.status).toBe(403);
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
      expect(mocks.upsert).not.toHaveBeenCalled();
    },
  );

  it("uses the session id and ignores a body userId", async () => {
    const res = await call({ ...KEYS, userId: "other-user" });
    expect(res.status).toBe(200);
    expect(mocks.profileEq).toHaveBeenCalledWith("id", "me");
    expect(mocks.selectEq).toHaveBeenCalledWith("profileId", "me");
    expect(upserted().profileId).toBe("me");
    expect(JSON.stringify(mocks.upsert.mock.calls)).not.toContain("other-user");
  });

  it("returns 400 for missing companyName", async () => {
    const res = await call({ industry: "Tech" });
    expect(res.status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await call("nope");
    expect(res.status).toBe(400);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });

  it("creates a new row as PENDING, unverified, with a generated id", async () => {
    await call(KEYS);
    const row = upserted();
    expect(row.approvalStatus).toBe("PENDING");
    expect(row.isVerified).toBe(false);
    expect(row.id).toBeTruthy();
  });

  it("keeps APPROVED and preserves isVerified when key fields match", async () => {
    existingRow();
    await call({ ...KEYS, website: "x" });
    const row = upserted();
    expect(row.approvalStatus).toBe("APPROVED");
    expect(row.isVerified).toBe(true);
    expect(row.id).toBe("emp-1");
    expect(mocks.upsert.mock.calls[0]![1]).toEqual({ onConflict: "profileId" });
  });

  it.each([
    ["companyName", { companyName: "Other" }],
    ["industry", { industry: "Finance" }],
    ["companySize", { companySize: "500+" }],
  ])("APPROVED becomes PENDING when %s changes", async (_n, over) => {
    existingRow();
    await call({ ...KEYS, ...over });
    expect(upserted().approvalStatus).toBe("PENDING");
  });

  it("keeps SUSPENDED even with a key change", async () => {
    existingRow({ approvalStatus: "SUSPENDED" });
    await call({ ...KEYS, companyName: "Other" });
    expect(upserted().approvalStatus).toBe("SUSPENDED");
  });

  it.each(["REJECTED", "PENDING"])("%s becomes PENDING", async (status) => {
    existingRow({ approvalStatus: status });
    await call(KEYS);
    expect(upserted().approvalStatus).toBe("PENDING");
  });

  it("accepts skip-all with empty companyName and writes nulls", async () => {
    const res = await call({ companyName: "" });
    expect(res.status).toBe(200);
    expect(upserted()).toMatchObject({
      companyName: "",
      industry: null,
      companySize: null,
      website: null,
      description: null,
    });
  });

  it("returns a generic 500 without leaking the raw error", async () => {
    mocks.profileEq.mockResolvedValue({ error: { message: "secret db detail" } });
    const res = await call(KEYS);
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toContain("Failed to save profile");
    expect(text).not.toContain("secret db detail");
  });
});
