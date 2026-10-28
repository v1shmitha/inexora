import { describe, expect, it, vi } from "vitest";

// trpc.ts imports the Prisma client and the Supabase server client.
// Neither is needed to test the role guards, so replace them with stubs.
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  adminProcedure,
  createCallerFactory,
  createTRPCRouter,
  employerProcedure,
  lecturerProcedure,
  managerProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  makeCtx,
  makeEmployer,
  makeLecturer,
  makeManagerEntry,
  makeProfile,
} from "~/test/trpc-context";

// A throwaway router with one endpoint per procedure type.
const testRouter = createTRPCRouter({
  public: publicProcedure.query(() => "ok"),
  protected: protectedProcedure.query(() => "ok"),
  lecturer: lecturerProcedure.query(() => "ok"),
  employer: employerProcedure.query(() => "ok"),
  manager: managerProcedure.query(() => "ok"),
  admin: adminProcedure.query(() => "ok"),
});
const createCaller = createCallerFactory(testRouter);
const as = (ctx: Parameters<typeof createCaller>[0]) => createCaller(ctx);

const loggedOut = makeCtx({ profile: null });
const student = makeCtx({ profile: makeProfile({ role: "STUDENT" }) });
const approvedLecturer = (lecturer: Parameters<typeof makeLecturer>[0] = {}) =>
  makeCtx({
    profile: makeProfile({ role: "LECTURER", lecturer: makeLecturer(lecturer) }),
  });
const approvedEmployer = (employer: Parameters<typeof makeEmployer>[0] = {}) =>
  makeCtx({
    profile: makeProfile({ role: "EMPLOYER", employer: makeEmployer(employer) }),
  });

describe("publicProcedure", () => {
  it("allows logged-out users", async () => {
    await expect(as(loggedOut).public()).resolves.toBe("ok");
  });
});

describe("protectedProcedure", () => {
  it("rejects logged-out users", async () => {
    await expect(as(loggedOut).protected()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects a Supabase user with no profile row", async () => {
    await expect(
      as(makeCtx({ profile: null, hasUser: true })).protected(),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects suspended accounts", async () => {
    const ctx = makeCtx({ profile: makeProfile({ isActive: false }) });
    await expect(as(ctx).protected()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Account is suspended",
    });
  });

  it("allows an active logged-in user", async () => {
    await expect(as(student).protected()).resolves.toBe("ok");
  });
});

describe("lecturerProcedure", () => {
  it("allows an approved lecturer", async () => {
    await expect(as(approvedLecturer()).lecturer()).resolves.toBe("ok");
  });

  it("rejects non-lecturer roles", async () => {
    await expect(as(student).lecturer()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects a LECTURER role with no lecturer row", async () => {
    const ctx = makeCtx({ profile: makeProfile({ role: "LECTURER" }) });
    await expect(as(ctx).lecturer()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Lecturer profile not found",
    });
  });

  it.each(["PENDING", "REJECTED", "SUSPENDED"] as const)(
    "rejects a %s lecturer",
    async (approvalStatus) => {
      await expect(
        as(approvedLecturer({ approvalStatus })).lecturer(),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    },
  );

  it("rejects an approved lecturer whose account is suspended", async () => {
    const ctx = makeCtx({
      profile: makeProfile({
        role: "LECTURER",
        isActive: false,
        lecturer: makeLecturer(),
      }),
    });
    await expect(as(ctx).lecturer()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Account is suspended",
    });
  });
});

describe("employerProcedure", () => {
  it("allows an approved employer", async () => {
    await expect(as(approvedEmployer()).employer()).resolves.toBe("ok");
  });

  it("rejects non-employer roles", async () => {
    await expect(as(approvedLecturer()).employer()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects an EMPLOYER role with no employer row", async () => {
    const ctx = makeCtx({ profile: makeProfile({ role: "EMPLOYER" }) });
    await expect(as(ctx).employer()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Employer profile not found",
    });
  });

  it.each(["PENDING", "REJECTED", "SUSPENDED"] as const)(
    "rejects a %s employer",
    async (approvalStatus) => {
      await expect(
        as(approvedEmployer({ approvalStatus })).employer(),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    },
  );
});

describe("managerProcedure", () => {
  it("allows a lecturer who can manage programs", async () => {
    const ctx = approvedLecturer({
      managedInstitutions: [makeManagerEntry({ canManagePrograms: true })],
    });
    await expect(as(ctx).manager()).resolves.toBe("ok");
  });

  it("rejects a lecturer who manages no institution", async () => {
    await expect(as(approvedLecturer()).manager()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Institution manager access required",
    });
  });

  it("rejects a manager without canManagePrograms", async () => {
    const ctx = approvedLecturer({
      managedInstitutions: [makeManagerEntry({ canManagePrograms: false })],
    });
    await expect(as(ctx).manager()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects a pending lecturer even if listed as a manager", async () => {
    const ctx = approvedLecturer({
      approvalStatus: "PENDING",
      managedInstitutions: [makeManagerEntry()],
    });
    await expect(as(ctx).manager()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("adminProcedure", () => {
  it("allows a profile with is_admin = true", async () => {
    const ctx = makeCtx({ profile: makeProfile({ is_admin: true }) });
    await expect(as(ctx).admin()).resolves.toBe("ok");
  });

  it("rejects normal users", async () => {
    await expect(as(student).admin()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  // Documents current behaviour: admin access comes from the is_admin flag,
  // not from role = ADMIN. If that ever changes, update this test on purpose.
  it("rejects role = ADMIN when is_admin is false", async () => {
    const ctx = makeCtx({ profile: makeProfile({ role: "ADMIN" }) });
    await expect(as(ctx).admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a suspended admin", async () => {
    const ctx = makeCtx({
      profile: makeProfile({ is_admin: true, isActive: false }),
    });
    await expect(as(ctx).admin()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
