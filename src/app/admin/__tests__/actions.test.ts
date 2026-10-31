import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const writes: Array<{ table: string; op: string; payload?: unknown }> = [];
  const state = {
    maybeSingle: {} as Record<string, unknown>,
  };
  const singleData = (table: string) => {
    if (table === "Institution")
      return { id: "inst1", name: "Uni", email: "a@b.co" };
    if (table === "Lecturer" || table === "Employer")
      return { profileId: "p1" };
    return { id: "x" };
  };
  const from = (table: string) => {
    let mode: "list" | "single" | "maybe" = "list";
    const chain: Record<string, unknown> = {};
    const result = () => {
      if (mode === "single") return { data: singleData(table), error: null };
      if (mode === "maybe")
        return { data: state.maybeSingle[table] ?? null, error: null };
      return { data: [], error: null };
    };
    for (const op of ["insert", "update", "delete"]) {
      chain[op] = (payload?: unknown) => {
        writes.push({ table, op, payload });
        return chain;
      };
    }
    for (const m of ["select", "eq", "in"]) chain[m] = () => chain;
    chain.single = () => {
      mode = "single";
      return chain;
    };
    chain.maybeSingle = () => {
      mode = "maybe";
      return chain;
    };
    chain.then = (resolve: (v: unknown) => unknown) => resolve(result());
    return chain;
  };
  const authAdmin = {
    updateUserById: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    deleteUser: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    listUsers: vi.fn(() =>
      Promise.resolve({ data: { users: [] }, error: null }),
    ),
    createUser: vi.fn(() =>
      Promise.resolve({ data: { user: { id: "newuser" } }, error: null }),
    ),
    generateLink: vi.fn(() =>
      Promise.resolve({
        data: { properties: { action_link: "https://link" } },
        error: null,
      }),
    ),
  };
  return {
    writes,
    state,
    from,
    authAdmin,
    getUser: vi.fn(),
    createAdminClient: vi.fn(),
    profileFindUnique: vi.fn(),
    profileUpdate: vi.fn(),
    lecturerUpdateMany: vi.fn(),
    revalidatePath: vi.fn(),
  };
});

vi.mock("~/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mocks.getUser } }),
  ),
}));
vi.mock("~/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));
vi.mock("~/server/db", () => ({
  db: {
    profile: {
      findUnique: mocks.profileFindUnique,
      update: mocks.profileUpdate,
    },
    lecturer: { updateMany: mocks.lecturerUpdateMany },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import * as actions from "../actions";

const perms = {
  canEditProfile: true,
  canManagePrograms: true,
  canViewAnalytics: false,
  canPostAnnouncements: false,
};

const CASES: Array<[string, () => Promise<unknown>]> = [
  // users
  ["suspendUser", () => actions.suspendUser("p1")],
  ["reactivateUser", () => actions.reactivateUser("p1")],
  ["deleteUser", () => actions.deleteUser("p1")],
  // lecturers
  ["approveLecturer", () => actions.approveLecturer("l1")],
  ["rejectLecturer", () => actions.rejectLecturer("l1")],
  ["reApproveLecturer", () => actions.reApproveLecturer("l1")],
  // employers
  ["approveEmployer", () => actions.approveEmployer("e1")],
  ["rejectEmployer", () => actions.rejectEmployer("e1")],
  ["reApproveEmployer", () => actions.reApproveEmployer("e1")],
  // institutions
  ["approveInstitution", () => actions.approveInstitution("i1")],
  ["rejectInstitution", () => actions.rejectInstitution("i1")],
  ["suspendInstitution", () => actions.suspendInstitution("i1")],
  ["reactivateInstitution", () => actions.reactivateInstitution("i1")],
  ["deleteInstitution", () => actions.deleteInstitution("i1")],
  [
    "createInstitution",
    () =>
      actions.createInstitution({
        name: "Uni",
        type: "UNIVERSITY",
        country: "LK",
      }),
  ],
  ["updateInstitution", () => actions.updateInstitution("i1", { name: "New" })],
  ["createInstitutionAccount", () => actions.createInstitutionAccount("i1")],
  ["deleteInstitutionAccount", () => actions.deleteInstitutionAccount("i1")],
  // programs
  ["toggleProgram", () => actions.toggleProgram("pr1", true)],
  ["deleteProgram", () => actions.deleteProgram("pr1")],
  // jobs
  ["toggleJob", () => actions.toggleJob("j1", true)],
  ["deleteJob", () => actions.deleteJob("j1")],
  // managers
  [
    "assignManager",
    () => actions.assignManager({ institutionId: "i1", lecturerId: "l1" }),
  ],
  ["removeManager", () => actions.removeManager("m1")],
  [
    "updateManagerPermissions",
    () => actions.updateManagerPermissions("m1", perms),
  ],
];

function loginAs(role: string | null, isActive = true) {
  if (role === null) {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.profileFindUnique.mockResolvedValue(null);
    return;
  }
  mocks.getUser.mockResolvedValue({ data: { user: { id: "caller" } } });
  mocks.profileFindUnique.mockResolvedValue({ id: "caller", role, isActive });
}

function expectNoSideEffects() {
  expect(mocks.createAdminClient).not.toHaveBeenCalled();
  expect(mocks.profileUpdate).not.toHaveBeenCalled();
  expect(mocks.lecturerUpdateMany).not.toHaveBeenCalled();
  expect(mocks.writes).toHaveLength(0);
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
}

beforeEach(() => {
  mocks.writes.length = 0;
  mocks.state.maybeSingle = { InstitutionAccount: { profileId: "p1" } };
  mocks.createAdminClient.mockImplementation(() => ({
    from: mocks.from,
    auth: { admin: mocks.authAdmin },
  }));
  mocks.profileUpdate.mockResolvedValue({});
  mocks.lecturerUpdateMany.mockResolvedValue({ count: 1 });
});

describe("admin actions: coverage", () => {
  it("covers every exported action", () => {
    expect(Object.keys(actions).sort()).toEqual(CASES.map(([n]) => n).sort());
    expect(CASES).toHaveLength(25);
  });
});

describe("admin actions: authorization", () => {
  it.each(CASES)("%s rejects a logged-out caller", async (_n, run) => {
    loginAs(null);
    await expect(run()).rejects.toThrow("Not authenticated");
    expectNoSideEffects();
  });

  for (const role of ["STUDENT", "LECTURER", "INSTITUTION", "EMPLOYER"]) {
    it.each(CASES)(`%s rejects role ${role}`, async (_n, run) => {
      loginAs(role);
      await expect(run()).rejects.toThrow("Forbidden");
      expectNoSideEffects();
    });
  }

  it.each(CASES)("%s rejects a suspended admin", async (_n, run) => {
    loginAs("ADMIN", false);
    await expect(run()).rejects.toThrow("Forbidden");
    expectNoSideEffects();
  });

  it("denies a profile with is_admin true but role STUDENT", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "caller" } } });
    mocks.profileFindUnique.mockResolvedValue({
      id: "caller",
      role: "STUDENT",
      isActive: true,
      is_admin: true,
    });
    await expect(actions.deleteUser("p1")).rejects.toThrow("Forbidden");
    expectNoSideEffects();
  });
});

describe("admin actions: admin allowed", () => {
  beforeEach(() => loginAs("ADMIN"));

  it("suspendUser (users)", async () => {
    await actions.suspendUser("p1");
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isActive: false },
    });
    expect(mocks.authAdmin.updateUserById).toHaveBeenCalled();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("approveLecturer (lecturers)", async () => {
    await actions.approveLecturer("l1");
    expect(mocks.writes).toContainEqual({
      table: "Lecturer",
      op: "update",
      payload: { approvalStatus: "APPROVED" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("approveEmployer (employers)", async () => {
    await actions.approveEmployer("e1");
    expect(
      mocks.writes.some((w) => w.table === "Employer" && w.op === "update"),
    ).toBe(true);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("approveInstitution (institutions)", async () => {
    await actions.approveInstitution("i1");
    expect(mocks.writes).toContainEqual({
      table: "Institution",
      op: "update",
      payload: { isVerified: true, isActive: true, approvalStatus: "APPROVED" },
    });
  });

  it("createInstitution returns the row and accepts an empty email", async () => {
    const row: unknown = await actions.createInstitution({
      name: "Uni",
      type: "UNIVERSITY",
      country: "LK",
      email: "",
    });
    expect(row).toEqual({ id: "inst1", name: "Uni", email: "a@b.co" });
    const insert = mocks.writes.find(
      (w) => w.table === "Institution" && w.op === "insert",
    );
    expect((insert?.payload as { email: string }).email).toBe("");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("createInstitutionAccount returns the link", async () => {
    mocks.state.maybeSingle = {};
    await expect(actions.createInstitutionAccount("i1")).resolves.toEqual({
      link: "https://link",
    });
    expect(mocks.authAdmin.createUser).toHaveBeenCalled();
  });

  it("toggleProgram (programs)", async () => {
    await actions.toggleProgram("pr1", true);
    expect(mocks.writes).toContainEqual({
      table: "Program",
      op: "update",
      payload: { isPublished: false },
    });
  });

  it("toggleJob (jobs)", async () => {
    await actions.toggleJob("j1", false);
    expect(mocks.writes).toContainEqual({
      table: "JobListing",
      op: "update",
      payload: { isActive: true },
    });
  });

  it("removeManager (managers)", async () => {
    await actions.removeManager("m1");
    expect(
      mocks.writes.some(
        (w) => w.table === "InstitutionManager" && w.op === "delete",
      ),
    ).toBe(true);
  });

  it("assignManager uses the caller id and ignores a forged assignedBy", async () => {
    await actions.assignManager({
      institutionId: "i1",
      lecturerId: "l1",
      assignedBy: "attacker",
    } as unknown as Parameters<typeof actions.assignManager>[0]);
    const insert = mocks.writes.find(
      (w) => w.table === "InstitutionManager" && w.op === "insert",
    );
    expect((insert?.payload as { assignedBy: string }).assignedBy).toBe(
      "caller",
    );
  });
});

describe("admin actions: input validation", () => {
  beforeEach(() => loginAs("ADMIN"));

  function expectNoWrites() {
    expect(mocks.writes).toHaveLength(0);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  }

  it("rejects an empty id", async () => {
    await expect(actions.suspendUser("")).rejects.toThrow("Invalid id");
    await expect(actions.deleteJob("")).rejects.toThrow("Invalid id");
    expectNoWrites();
  });

  it("rejects createInstitution without a name", async () => {
    await expect(
      actions.createInstitution({
        type: "U",
        country: "LK",
      } as unknown as Parameters<typeof actions.createInstitution>[0]),
    ).rejects.toThrow();
    expectNoWrites();
  });

  it("rejects a non-boolean toggle argument", async () => {
    await expect(
      actions.toggleProgram("pr1", "yes" as unknown as boolean),
    ).rejects.toThrow();
    expectNoWrites();
  });

  it("rejects updateManagerPermissions with a missing permission", async () => {
    await expect(
      actions.updateManagerPermissions("m1", {
        canEditProfile: true,
      } as unknown as typeof perms),
    ).rejects.toThrow();
    expectNoWrites();
  });

  it("rejects a bad email", async () => {
    await expect(
      actions.createInstitution({
        name: "Uni",
        type: "U",
        country: "LK",
        email: "not-an-email",
      }),
    ).rejects.toThrow("Invalid email");
    expectNoWrites();
  });
});
