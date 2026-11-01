import { describe, expect, it, vi, type Mock } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createCallerFactory } from "~/server/api/trpc";
import { enrollmentRouter } from "~/server/api/routers/enrollment";
import { makeCtx, makeProfile } from "~/test/trpc-context";

const createCaller = createCallerFactory(enrollmentRouter);
const dec = (v: string) => ({ toString: () => v });

type Prices = { localPrice: unknown; foreignPrice: unknown };

function programDb(prices: Prices) {
  return {
    student: { findUnique: vi.fn().mockResolvedValue({ id: "s1" }) },
    enrollment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "e1" }),
    },
    program: {
      findUnique: vi.fn().mockResolvedValue({
        id: "p1",
        title: "Prog",
        isPublished: true,
        approvalStatus: "APPROVED",
        ...prices,
      }),
    },
    course: { findMany: vi.fn().mockResolvedValue([]) },
    courseEnrollment: { createMany: vi.fn() },
    payment: { create: vi.fn().mockResolvedValue({ id: "pay1" }) },
  };
}

function courseDb(prices: Prices) {
  return {
    student: { findUnique: vi.fn().mockResolvedValue({ id: "s1" }) },
    courseEnrollment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ce1" }),
    },
    course: {
      findUnique: vi.fn().mockResolvedValue({
        id: "c1",
        title: "Course",
        isPublished: true,
        isStandalone: true,
        ...prices,
      }),
    },
    payment: { create: vi.fn().mockResolvedValue({ id: "pay1" }) },
  };
}

function firstArg<T>(fn: Mock): T {
  return fn.mock.calls[0]![0] as T;
}

type CreateArg = {
  data: { status?: string; amount?: number; currency?: string };
};
type OrArg = Record<string, unknown>[];
type AnnArg = {
  where: {
    isPublished: boolean;
    targetAudience: unknown;
    AND: { OR: OrArg }[];
  };
  orderBy: unknown;
  take: number;
};

const student = () => makeProfile({ role: "STUDENT" });

describe("enrollment.enrollInProgram pricing", () => {
  it("enrolls immediately when both prices are empty", async () => {
    const db = programDb({ localPrice: null, foreignPrice: null });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInProgram({ programId: "p1" });
    expect(r.type).toBe("enrolled");
    expect(db.payment.create).not.toHaveBeenCalled();
    expect(firstArg<CreateArg>(db.enrollment.create).data.status).toBe(
      "ACTIVE",
    );
  });

  it("requires USD payment for a foreign-only program, no ACTIVE enrollment", async () => {
    const db = programDb({ localPrice: null, foreignPrice: dec("300") });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInProgram({ programId: "p1" });
    expect(r).toMatchObject({
      type: "payment_required",
      amount: 300,
      currency: "USD",
    });
    expect(firstArg<CreateArg>(db.payment.create).data).toMatchObject({
      amount: 300,
      currency: "USD",
    });
    expect(db.enrollment.create).toHaveBeenCalledTimes(1);
    expect(firstArg<CreateArg>(db.enrollment.create).data.status).toBe(
      "PENDING",
    );
  });

  it("charges LKR for a local-only program", async () => {
    const db = programDb({ localPrice: dec("50000"), foreignPrice: null });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInProgram({ programId: "p1" });
    expect(r).toMatchObject({
      type: "payment_required",
      amount: 50000,
      currency: "LKR",
    });
    expect(firstArg<CreateArg>(db.payment.create).data).toMatchObject({
      amount: 50000,
      currency: "LKR",
    });
  });
});

describe("enrollment.enrollInCourse pricing", () => {
  it("enrolls immediately when free", async () => {
    const db = courseDb({ localPrice: 0, foreignPrice: null });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInCourse({ courseId: "c1" });
    expect(r.type).toBe("enrolled");
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  it("requires USD payment for a foreign-only course", async () => {
    const db = courseDb({ localPrice: null, foreignPrice: 40 });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInCourse({ courseId: "c1" });
    expect(r).toMatchObject({
      type: "payment_required",
      amount: 40,
      currency: "USD",
    });
    expect(db.courseEnrollment.create).not.toHaveBeenCalled();
  });

  it("charges LKR for a local-only course", async () => {
    const db = courseDb({ localPrice: 8000, foreignPrice: null });
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).enrollInCourse({ courseId: "c1" });
    expect(r).toMatchObject({
      type: "payment_required",
      amount: 8000,
      currency: "LKR",
    });
  });
});

describe("enrollment.getMyAnnouncements", () => {
  function annDb(enrollments: unknown[], studentRow: unknown = { id: "s1" }) {
    return {
      student: { findUnique: vi.fn().mockResolvedValue(studentRow) },
      enrollment: { findMany: vi.fn().mockResolvedValue(enrollments) },
      announcement: { findMany: vi.fn().mockResolvedValue([{ id: "a1" }]) },
    };
  }

  it("scopes announcements to enrolled institutions/programs for a STUDENT", async () => {
    const db = annDb([
      { programId: "p1", program: { institutionId: "i1" } },
      { programId: "p2", program: { institutionId: "i1" } },
    ]);
    const r = await createCaller(
      makeCtx({ profile: student(), db }),
    ).getMyAnnouncements();
    expect(r).toEqual([{ id: "a1" }]);

    expect(firstArg<{ where: unknown }>(db.enrollment.findMany).where).toEqual({
      studentId: "s1",
      status: { in: ["ACTIVE", "APPROVED", "COMPLETED"] },
    });
    const args = firstArg<AnnArg>(db.announcement.findMany);
    expect(args.where.isPublished).toBe(true);
    expect(args.where.targetAudience).toEqual({
      hasSome: ["all", "students"],
    });
    expect(args.where.AND[0]!.OR[0]).toEqual({ expiresAt: null });
    expect(
      (args.where.AND[0]!.OR[1]!.expiresAt as { gt: Date }).gt,
    ).toBeInstanceOf(Date);
    expect(args.where.AND[1]!.OR).toEqual([
      { institutionId: null, programId: null },
      { institutionId: { in: ["i1"] } },
      { programId: { in: ["p1", "p2"] } },
    ]);
    expect(args.orderBy).toEqual([
      { publishedAt: "desc" },
      { createdAt: "desc" },
    ]);
    expect(args.take).toBe(10);
  });

  it("honours the limit input", async () => {
    const db = annDb([]);
    await createCaller(makeCtx({ profile: student(), db })).getMyAnnouncements({
      limit: 5,
    });
    expect(firstArg<AnnArg>(db.announcement.findMany).take).toBe(5);
  });

  it("with no enrollments only matches platform-wide scope", async () => {
    const db = annDb([]);
    await createCaller(
      makeCtx({ profile: student(), db }),
    ).getMyAnnouncements();
    const scope = firstArg<AnnArg>(db.announcement.findMany).where.AND[1]!.OR;
    expect(scope).toEqual([
      { institutionId: null, programId: null },
      { institutionId: { in: [] } },
      { programId: { in: [] } },
    ]);
  });

  it("denies a LECTURER", async () => {
    const db = annDb([]);
    await expect(
      createCaller(
        makeCtx({ profile: makeProfile({ role: "LECTURER" }), db }),
      ).getMyAnnouncements(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.announcement.findMany).not.toHaveBeenCalled();
  });

  it("denies a STUDENT without a Student row", async () => {
    const db = annDb([], null);
    await expect(
      createCaller(makeCtx({ profile: student(), db })).getMyAnnouncements(),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(db.announcement.findMany).not.toHaveBeenCalled();
  });
});
