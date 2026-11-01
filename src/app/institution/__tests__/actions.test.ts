import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const m = {
    getUser: vi.fn(),
    createAdminClient: vi.fn(),
    revalidatePath: vi.fn(),
    profileFindUnique: vi.fn(),
    accountFindUnique: vi.fn(),
    programFindUnique: vi.fn(),
    programCreate: vi.fn(),
    programUpdate: vi.fn(),
    announcementFindUnique: vi.fn(),
    announcementCreate: vi.fn(),
    announcementUpdate: vi.fn(),
    announcementDelete: vi.fn(),
    institutionUpdate: vi.fn(),
    transaction: vi.fn(),
    tx: {
      enrollment: { count: vi.fn() },
      courseEnrollment: { count: vi.fn() },
      credential: { count: vi.fn() },
      assessmentSubmission: { count: vi.fn() },
      assessment: { deleteMany: vi.fn() },
      courseLecturer: { deleteMany: vi.fn() },
      course: { deleteMany: vi.fn() },
      announcement: { deleteMany: vi.fn() },
      program: { delete: vi.fn() },
    },
  };
  return m;
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
    profile: { findUnique: mocks.profileFindUnique },
    institutionAccount: { findUnique: mocks.accountFindUnique },
    program: {
      findUnique: mocks.programFindUnique,
      create: mocks.programCreate,
      update: mocks.programUpdate,
    },
    announcement: {
      findUnique: mocks.announcementFindUnique,
      create: mocks.announcementCreate,
      update: mocks.announcementUpdate,
      delete: mocks.announcementDelete,
    },
    institution: { update: mocks.institutionUpdate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import * as actions from "../actions";

const validProgram = {
  title: "BSc Computing",
  type: "BACHELOR",
  level: "UNDERGRADUATE",
  field: "OTHER",
  deliveryMode: "ON_CAMPUS",
};

const CASES: Array<[string, () => Promise<unknown>]> = [
  ["createProgram", () => actions.createProgram(validProgram)],
  ["updateProgram", () => actions.updateProgram("pr1", { title: "New" })],
  ["toggleProgram", () => actions.toggleProgram("pr1", false)],
  ["deleteProgram", () => actions.deleteProgram("pr1")],
  ["createAnnouncement", () => actions.createAnnouncement({ title: "Hello" })],
  ["toggleAnnouncement", () => actions.toggleAnnouncement("a1", false)],
  ["deleteAnnouncement", () => actions.deleteAnnouncement("a1")],
  [
    "updateInstitutionProfile",
    () => actions.updateInstitutionProfile({ name: "Uni" }),
  ],
];

// Actions that take an existing row id and therefore need an ownership check.
const ID_CASES = CASES.filter(([n]) =>
  [
    "updateProgram",
    "toggleProgram",
    "deleteProgram",
    "toggleAnnouncement",
    "deleteAnnouncement",
  ].includes(n),
);

function loginAs(role: string | null, isActive = true) {
  if (role === null) {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    mocks.profileFindUnique.mockResolvedValue(null);
    return;
  }
  mocks.getUser.mockResolvedValue({ data: { user: { id: "caller" } } });
  mocks.profileFindUnique.mockResolvedValue({ id: "caller", role, isActive });
}

const writeMocks = () => [
  mocks.programCreate,
  mocks.programUpdate,
  mocks.announcementCreate,
  mocks.announcementUpdate,
  mocks.announcementDelete,
  mocks.institutionUpdate,
  mocks.transaction,
  mocks.createAdminClient,
  mocks.revalidatePath,
];

function expectNoSideEffects() {
  for (const fn of writeMocks()) expect(fn).not.toHaveBeenCalled();
}

function expectNoDbCalls() {
  expectNoSideEffects();
  expect(mocks.programFindUnique).not.toHaveBeenCalled();
  expect(mocks.announcementFindUnique).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  loginAs("INSTITUTION");
  mocks.accountFindUnique.mockResolvedValue({ institutionId: "inst1" });
  mocks.programFindUnique.mockResolvedValue({
    institutionId: "inst1",
    isPublished: false,
  });
  mocks.announcementFindUnique.mockResolvedValue({
    institutionId: "inst1",
    isPublished: false,
  });
  mocks.programCreate.mockResolvedValue({
    id: "pr1",
    title: "BSc Computing",
    type: "BACHELOR",
    level: "UNDERGRADUATE",
    isPublished: false,
    approvalStatus: "APPROVED",
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
    durationMonths: null,
    deliveryMode: "ON_CAMPUS",
  });
  mocks.announcementCreate.mockResolvedValue({
    id: "a1",
    title: "Hello",
    content: null,
    isPublished: false,
    createdAt: new Date("2026-01-02T03:04:05.000Z"),
  });
  mocks.transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
    cb(mocks.tx),
  );
  for (const key of [
    "enrollment",
    "courseEnrollment",
    "credential",
    "assessmentSubmission",
  ] as const) {
    mocks.tx[key].count.mockResolvedValue(0);
  }
});

describe("institution actions: authorization", () => {
  it.each(CASES)("%s rejects a logged-out caller", async (_n, run) => {
    loginAs(null);
    await expect(run()).rejects.toThrow("Not authenticated");
    expectNoDbCalls();
  });

  for (const role of ["STUDENT", "LECTURER", "EMPLOYER", "ADMIN"]) {
    it.each(CASES)(`%s rejects role ${role}`, async (_n, run) => {
      loginAs(role);
      await expect(run()).rejects.toThrow("Forbidden");
      expectNoDbCalls();
    });
  }

  it.each(CASES)("%s rejects a suspended institution", async (_n, run) => {
    loginAs("INSTITUTION", false);
    await expect(run()).rejects.toThrow("Forbidden");
    expectNoDbCalls();
  });

  it.each(CASES)("%s rejects an account-less institution", async (_n, run) => {
    mocks.accountFindUnique.mockResolvedValue(null);
    await expect(run()).rejects.toThrow("Forbidden");
    expectNoDbCalls();
  });
});

describe("institution actions: ownership", () => {
  it.each(ID_CASES)("%s denies another institution's row", async (_n, run) => {
    mocks.programFindUnique.mockResolvedValue({
      institutionId: "other",
      isPublished: false,
    });
    mocks.announcementFindUnique.mockResolvedValue({
      institutionId: "other",
      isPublished: false,
    });
    await expect(run()).rejects.toThrow("Not found");
    expectNoSideEffects();
  });

  it.each(ID_CASES)("%s gives the same error for a missing row", async (_n, run) => {
    mocks.programFindUnique.mockResolvedValue(null);
    mocks.announcementFindUnique.mockResolvedValue(null);
    await expect(run()).rejects.toThrow("Not found");
    expectNoSideEffects();
  });

  it("looks the target up by id only", async () => {
    await actions.toggleProgram("pr1", false);
    expect(mocks.programFindUnique).toHaveBeenCalledWith({
      where: { id: "pr1" },
      select: { institutionId: true, isPublished: true },
    });
  });
});

describe("institution actions: derived ids", () => {
  it("createProgram uses the caller institution, ignoring client input", async () => {
    await actions.createProgram({
      ...validProgram,
      institutionId: "evil",
    } as Parameters<typeof actions.createProgram>[0]);
    const arg = mocks.programCreate.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.institutionId).toBe("inst1");
    expect(arg.data.isPublished).toBe(false);
    expect(arg.data.isActive).toBe(true);
    expect(arg.data.approvalStatus).toBe("APPROVED");
    expect(arg.data.language).toEqual(["English"]);
    expect(arg.data.slug).toMatch(/^bsc-computing-/);
  });

  it("createProgram returns ISO date strings and an empty course list", async () => {
    const result = (await actions.createProgram(validProgram)) as {
      createdAt: unknown;
      courses: unknown[];
    };
    expect(result.createdAt).toBe("2026-01-02T03:04:05.000Z");
    expect(result.courses).toEqual([]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/institution");
  });

  it("createAnnouncement derives institutionId and publishedBy from the caller", async () => {
    await actions.createAnnouncement({
      title: "Hello",
      institutionId: "evil",
      publishedBy: "evil",
    } as Parameters<typeof actions.createAnnouncement>[0]);
    const arg = mocks.announcementCreate.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data).toMatchObject({
      institutionId: "inst1",
      publishedBy: "caller",
      isPublished: false,
      targetAudience: ["all"],
    });
  });

  it("createAnnouncement returns an ISO createdAt", async () => {
    const result = (await actions.createAnnouncement({
      title: "Hello",
    })) as { createdAt: unknown };
    expect(result.createdAt).toBe("2026-01-02T03:04:05.000Z");
  });

  it("updateInstitutionProfile targets the caller institution", async () => {
    await actions.updateInstitutionProfile({
      name: "Uni",
      id: "evil",
    } as Parameters<typeof actions.updateInstitutionProfile>[0]);
    expect(mocks.institutionUpdate).toHaveBeenCalledWith({
      where: { id: "inst1" },
      data: { name: "Uni" },
    });
  });

  it("updateInstitutionProfile keeps empty-string clears but drops empty name/country", async () => {
    await actions.updateInstitutionProfile({
      name: "",
      country: "",
      phone: "",
      email: "",
    });
    expect(mocks.institutionUpdate).toHaveBeenCalledWith({
      where: { id: "inst1" },
      data: { phone: "", email: "" },
    });
  });
});

describe("institution actions: validation", () => {
  it.each([
    ["empty program id", () => actions.updateProgram("", {})],
    ["empty toggle program id", () => actions.toggleProgram("", true)],
    ["empty delete program id", () => actions.deleteProgram("")],
    ["empty toggle announcement id", () => actions.toggleAnnouncement("", true)],
    ["empty delete announcement id", () => actions.deleteAnnouncement("")],
    [
      "bad enum",
      () => actions.createProgram({ ...validProgram, type: "NOPE" }),
    ],
    [
      "bad update enum",
      () => actions.updateProgram("pr1", { level: "NOPE" }),
    ],
    [
      "blank title",
      () => actions.createProgram({ ...validProgram, title: "   " }),
    ],
    [
      "negative price",
      () => actions.createProgram({ ...validProgram, localPrice: -5 }),
    ],
    [
      "non-integer duration",
      () => actions.createProgram({ ...validProgram, durationMonths: 1.5 }),
    ],
    ["blank announcement title", () => actions.createAnnouncement({ title: "" })],
    [
      "bad email",
      () => actions.updateInstitutionProfile({ email: "not-an-email" }),
    ],
    [
      "non-boolean program flag",
      () => actions.toggleProgram("pr1", "yes" as unknown as boolean),
    ],
    [
      "non-boolean announcement flag",
      () => actions.toggleAnnouncement("a1", 1 as unknown as boolean),
    ],
  ] as Array<[string, () => Promise<unknown>]>)(
    "rejects %s without touching the database",
    async (_n, run) => {
      await expect(run()).rejects.toThrow();
      expectNoDbCalls();
    },
  );
});

describe("institution actions: programs", () => {
  it("createProgram writes priceUsd from foreignPrice", async () => {
    await actions.createProgram({ ...validProgram, foreignPrice: 1200 });
    const arg = mocks.programCreate.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.foreignPrice).toBe(1200);
    expect(arg.data.priceUsd).toBe(1200);
    expect(arg.data.priceUsdUpdatedAt).toBeInstanceOf(Date);
  });

  it("createProgram leaves priceUsd null without a foreign price", async () => {
    await actions.createProgram(validProgram);
    const arg = mocks.programCreate.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.priceUsd).toBeNull();
    expect(arg.data.priceUsdUpdatedAt).toBeNull();
  });

  it("updateProgram drops falsy values and does not touch priceUsd", async () => {
    await actions.updateProgram("pr1", {
      title: "New",
      description: "",
      durationMonths: undefined,
    });
    expect(mocks.programUpdate).toHaveBeenCalledWith({
      where: { id: "pr1" },
      data: { title: "New" },
    });
  });

  it("updateProgram syncs priceUsd when foreignPrice is set", async () => {
    await actions.updateProgram("pr1", { foreignPrice: 900 });
    const arg = mocks.programUpdate.mock.calls[0]![0] as {
      data: Record<string, unknown>;
    };
    expect(arg.data.foreignPrice).toBe(900);
    expect(arg.data.priceUsd).toBe(900);
    expect(arg.data.priceUsdUpdatedAt).toBeInstanceOf(Date);
  });

  it.each([
    [false, true],
    [true, false],
  ])("toggleProgram derives the new state from the DB row (stored %s)", async (stored, expected) => {
    mocks.programFindUnique.mockResolvedValue({
      institutionId: "inst1",
      isPublished: stored,
    });
    // client claims the opposite of the stored state
    await actions.toggleProgram("pr1", !stored);
    expect(mocks.programUpdate).toHaveBeenCalledWith({
      where: { id: "pr1" },
      data: { isPublished: expected },
    });
  });
});

describe("institution actions: deleteProgram", () => {
  it.each([
    ["enrollments", "enrollment"],
    ["course enrollments", "courseEnrollment"],
    ["credentials", "credential"],
    ["submissions", "assessmentSubmission"],
  ] as const)("refuses when the program has %s", async (_label, model) => {
    mocks.tx[model].count.mockResolvedValue(2);
    await expect(actions.deleteProgram("pr1")).rejects.toThrow(
      "Cannot delete a program that has enrollments, credentials or submissions",
    );
    expect(mocks.tx.assessment.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.courseLecturer.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.course.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.announcement.deleteMany).not.toHaveBeenCalled();
    expect(mocks.tx.program.delete).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("checks the right keys and deletes children before the program, in order", async () => {
    const order: string[] = [];
    const track = (name: string) => () => {
      order.push(name);
      return Promise.resolve({});
    };
    mocks.tx.assessment.deleteMany.mockImplementation(track("assessment"));
    mocks.tx.courseLecturer.deleteMany.mockImplementation(
      track("courseLecturer"),
    );
    mocks.tx.course.deleteMany.mockImplementation(track("course"));
    mocks.tx.announcement.deleteMany.mockImplementation(track("announcement"));
    mocks.tx.program.delete.mockImplementation(track("program"));

    await actions.deleteProgram("pr1");

    expect(mocks.tx.enrollment.count).toHaveBeenCalledWith({
      where: { programId: "pr1" },
    });
    expect(mocks.tx.courseEnrollment.count).toHaveBeenCalledWith({
      where: { course: { programId: "pr1" } },
    });
    expect(mocks.tx.credential.count).toHaveBeenCalledWith({
      where: { programId: "pr1" },
    });
    expect(mocks.tx.assessmentSubmission.count).toHaveBeenCalledWith({
      where: { assessment: { course: { programId: "pr1" } } },
    });
    expect(mocks.tx.assessment.deleteMany).toHaveBeenCalledWith({
      where: { course: { programId: "pr1" } },
    });
    expect(mocks.tx.courseLecturer.deleteMany).toHaveBeenCalledWith({
      where: { course: { programId: "pr1" } },
    });
    expect(mocks.tx.course.deleteMany).toHaveBeenCalledWith({
      where: { programId: "pr1" },
    });
    expect(mocks.tx.announcement.deleteMany).toHaveBeenCalledWith({
      where: { programId: "pr1" },
    });
    expect(mocks.tx.program.delete).toHaveBeenCalledWith({
      where: { id: "pr1" },
    });
    expect(order).toEqual([
      "assessment",
      "courseLecturer",
      "course",
      "announcement",
      "program",
    ]);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/institution");
  });

  it("propagates a transaction error and does not revalidate", async () => {
    mocks.tx.course.deleteMany.mockRejectedValue(new Error("fk violation"));
    await expect(actions.deleteProgram("pr1")).rejects.toThrow("fk violation");
    expect(mocks.tx.program.delete).not.toHaveBeenCalled();
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});

describe("institution actions: announcements", () => {
  it("toggleAnnouncement publishes with a publishedAt date", async () => {
    mocks.announcementFindUnique.mockResolvedValue({
      institutionId: "inst1",
      isPublished: false,
    });
    await actions.toggleAnnouncement("a1", true); // client claim ignored
    const arg = mocks.announcementUpdate.mock.calls[0]![0] as {
      where: unknown;
      data: { isPublished: boolean; publishedAt: unknown };
    };
    expect(arg.where).toEqual({ id: "a1" });
    expect(arg.data.isPublished).toBe(true);
    expect(arg.data.publishedAt).toBeInstanceOf(Date);
  });

  it("toggleAnnouncement unpublishes and clears publishedAt", async () => {
    mocks.announcementFindUnique.mockResolvedValue({
      institutionId: "inst1",
      isPublished: true,
    });
    await actions.toggleAnnouncement("a1", false);
    expect(mocks.announcementUpdate).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { isPublished: false, publishedAt: null },
    });
  });

  it("deleteAnnouncement deletes the owned row", async () => {
    await actions.deleteAnnouncement("a1");
    expect(mocks.announcementDelete).toHaveBeenCalledWith({
      where: { id: "a1" },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/institution");
  });
});
