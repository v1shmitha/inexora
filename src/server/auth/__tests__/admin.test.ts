import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("~/server/db", () => ({
  db: { profile: { findUnique: mocks.findUnique } },
}));

import { getCurrentProfile, requireAdmin, requireProfileRole } from "../admin";

function signedInAs(
  profile: { id: string; role: string; isActive: boolean } | null,
) {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.findUnique.mockResolvedValue(profile);
}

describe("getCurrentProfile", () => {
  it("returns null when there is no user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(getCurrentProfile()).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when there is no profile row", async () => {
    signedInAs(null);
    await expect(getCurrentProfile()).resolves.toBeNull();
  });
});

describe("requireAdmin", () => {
  it("rejects with Not authenticated when there is no user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireAdmin()).rejects.toThrow("Not authenticated");
  });

  it("rejects with Not authenticated when there is no profile row", async () => {
    signedInAs(null);
    await expect(requireAdmin()).rejects.toThrow("Not authenticated");
  });

  it("returns the id for an active admin", async () => {
    signedInAs({ id: "u1", role: "ADMIN", isActive: true });
    await expect(requireAdmin()).resolves.toEqual({ id: "u1" });
  });

  it("rejects non-admin roles with Forbidden", async () => {
    signedInAs({ id: "u1", role: "LECTURER", isActive: true });
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("rejects a suspended admin with Forbidden", async () => {
    signedInAs({ id: "u1", role: "ADMIN", isActive: false });
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });
});

describe("requireProfileRole", () => {
  it("returns 401 when there is no session", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    const res = await requireProfileRole("LECTURER");
    expect("response" in res && res.response.status).toBe(401);
  });

  it("returns 401 when there is a session but no profile", async () => {
    signedInAs(null);
    const res = await requireProfileRole("LECTURER");
    expect("response" in res && res.response.status).toBe(401);
  });

  it.each(["STUDENT", "EMPLOYER", "INSTITUTION", "ADMIN"])(
    "returns 403 for role %s",
    async (role) => {
      signedInAs({ id: "u1", role, isActive: true });
      const res = await requireProfileRole("LECTURER");
      expect("response" in res && res.response.status).toBe(403);
    },
  );

  it("returns 403 for an inactive profile", async () => {
    signedInAs({ id: "u1", role: "LECTURER", isActive: false });
    const res = await requireProfileRole("LECTURER");
    expect("response" in res && res.response.status).toBe(403);
  });

  it("returns the profile on a role match", async () => {
    const p = { id: "u1", role: "LECTURER", isActive: true };
    signedInAs(p);
    await expect(requireProfileRole("LECTURER")).resolves.toEqual({ profile: p });
  });
});
