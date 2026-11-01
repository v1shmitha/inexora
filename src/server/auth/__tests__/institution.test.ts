import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileFindUnique: vi.fn(),
  accountFindUnique: vi.fn(),
}));

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mocks.getUser } }),
  ),
}));
vi.mock("~/server/db", () => ({
  db: {
    profile: { findUnique: mocks.profileFindUnique },
    institutionAccount: { findUnique: mocks.accountFindUnique },
  },
}));

import { requireInstitution } from "../institution";

function signedInAs(
  profile: { id: string; role: string; isActive: boolean } | null,
) {
  mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.profileFindUnique.mockResolvedValue(profile);
}

describe("requireInstitution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.accountFindUnique.mockResolvedValue({ institutionId: "inst1" });
  });

  it("rejects with Not authenticated when there is no user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireInstitution()).rejects.toThrow("Not authenticated");
    expect(mocks.accountFindUnique).not.toHaveBeenCalled();
  });

  it("rejects with Not authenticated when there is no profile row", async () => {
    signedInAs(null);
    await expect(requireInstitution()).rejects.toThrow("Not authenticated");
  });

  it.each(["STUDENT", "LECTURER", "EMPLOYER", "ADMIN"])(
    "rejects %s with Forbidden",
    async (role) => {
      signedInAs({ id: "u1", role, isActive: true });
      await expect(requireInstitution()).rejects.toThrow("Forbidden");
      expect(mocks.accountFindUnique).not.toHaveBeenCalled();
    },
  );

  it("rejects a suspended institution account", async () => {
    signedInAs({ id: "u1", role: "INSTITUTION", isActive: false });
    await expect(requireInstitution()).rejects.toThrow("Forbidden");
  });

  it("rejects an institution profile with no InstitutionAccount", async () => {
    signedInAs({ id: "u1", role: "INSTITUTION", isActive: true });
    mocks.accountFindUnique.mockResolvedValue(null);
    await expect(requireInstitution()).rejects.toThrow("Forbidden");
  });

  it("returns the profile and institution ids for the owner", async () => {
    signedInAs({ id: "u1", role: "INSTITUTION", isActive: true });
    await expect(requireInstitution()).resolves.toEqual({
      profileId: "u1",
      institutionId: "inst1",
    });
    expect(mocks.accountFindUnique).toHaveBeenCalledWith({
      where: { profileId: "u1" },
      select: { institutionId: true },
    });
  });
});
