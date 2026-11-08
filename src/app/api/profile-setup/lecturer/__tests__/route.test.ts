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

const KEYS = {
  title: "Dr",
  qualifications: "PhD",
  experienceYears: 5,
  institutionId: "inst-1",
  specialization: ["a", "b"],
};

function session(role: string, id = "me", isActive = true) {
  mocks.getUser.mockResolvedValue({ data: { user: { id } } });
  mocks.findUnique.mockResolvedValue({ id, role, isActive });
}

function existingRow(over: Record<string, unknown> = {}) {
  mocks.maybeSingle.mockResolvedValue({
    data: { id: "lec-1", approvalStatus: "APPROVED", ...KEYS, ...over },
  });
}

function call(body: unknown) {
  return POST(
    new Request("http://localhost/api/profile-setup/lecturer", {
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
    from: (table: string) => {
      if (table === "Profile") return { update: mocks.profileUpdate };
      if (table === "Lecturer") return { select: mocks.select, upsert: mocks.upsert };
      throw new Error(`unexpected table ${table}`);
    },
  });
  session("LECTURER");
});

describe("POST /api/profile-setup/lecturer", () => {
  it("returns 401 when logged out and never builds the admin client", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const res = await call(KEYS);
    expect(res.status).toBe(401);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("returns a JSON 500 and builds no admin client when the session lookup throws", async () => {
    mocks.getUser.mockRejectedValue(new Error("outage detail"));
    const res = await call(KEYS);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to save profile" });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it.each(["STUDENT", "EMPLOYER", "INSTITUTION", "ADMIN"])(
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
    expect(JSON.stringify(mocks.profileEq.mock.calls)).not.toContain("other-user");
  });

  it.each([
    ["bad experienceYears", { experienceYears: "x" }],
    ["non-array specialization", { specialization: "a" }],
  ])("returns 400 for %s with no writes", async (_n, over) => {
    const res = await call({ ...KEYS, ...over });
    expect(res.status).toBe(400);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-JSON body", async () => {
    const res = await call("not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid request" });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("creates a new row as PENDING with generated id and updatedAt", async () => {
    await call(KEYS);
    const row = upserted();
    expect(row.approvalStatus).toBe("PENDING");
    expect(typeof row.id).toBe("string");
    expect(row.id).toBeTruthy();
    expect(typeof row.updatedAt).toBe("string");
  });

  it("keeps APPROVED when key fields match (null-vs-null, reordered specialization, optionals omitted)", async () => {
    existingRow({ title: null, qualifications: null, experienceYears: null, institutionId: null });
    const res = await call({ specialization: ["b", "a"] });
    expect(res.status).toBe(200);
    expect(upserted().approvalStatus).toBe("APPROVED");
  });

  it.each([
    ["title", { title: "Prof" }],
    ["qualifications", { qualifications: "MSc" }],
    ["experienceYears", { experienceYears: 6 }],
    ["institutionId", { institutionId: "inst-2" }],
    ["specialization", { specialization: ["a", "c"] }],
  ])("APPROVED becomes PENDING when %s changes", async (_n, over) => {
    existingRow();
    await call({ ...KEYS, ...over });
    expect(upserted().approvalStatus).toBe("PENDING");
  });

  it("keeps APPROVED when everything is identical", async () => {
    existingRow();
    await call(KEYS);
    expect(upserted().approvalStatus).toBe("APPROVED");
  });

  it("keeps SUSPENDED even with a key change", async () => {
    existingRow({ approvalStatus: "SUSPENDED" });
    await call({ ...KEYS, title: "Prof" });
    expect(upserted().approvalStatus).toBe("SUSPENDED");
  });

  it.each(["REJECTED", "PENDING"])("%s becomes PENDING", async (status) => {
    existingRow({ approvalStatus: status });
    await call(KEYS);
    expect(upserted().approvalStatus).toBe("PENDING");
  });

  it("reuses existing id and upserts on profileId", async () => {
    existingRow();
    await call(KEYS);
    expect(upserted().id).toBe("lec-1");
    expect(mocks.upsert.mock.calls[0]![1]).toEqual({ onConflict: "profileId" });
  });

  it("accepts a skip-all body and writes nulls", async () => {
    const res = await call({ specialization: [] });
    expect(res.status).toBe(200);
    expect(upserted()).toMatchObject({
      title: null,
      qualifications: null,
      experienceYears: null,
      bio: null,
      linkedinUrl: null,
      institutionId: null,
      hourlyRate: null,
      isVisiting: false,
      specialization: [],
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
