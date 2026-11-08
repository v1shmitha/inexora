import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createCallerFactory } from "~/server/api/trpc";
import { assessmentRouter } from "~/server/api/routers/assessment";
import { makeCtx, makeLecturer, makeProfile } from "~/test/trpc-context";

const createCaller = createCallerFactory(assessmentRouter);

// Strict fake table: any method not explicitly provided throws.
function strict<T extends object>(name: string, methods: T): T {
  return new Proxy(methods, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && !(prop in target)) {
        throw new Error(`Unexpected call: ${name}.${prop}`);
      }
      return Reflect.get(target, prop, receiver) as unknown;
    },
  });
}

type Opts = {
  totalMarks?: number | null;
  assigned?: boolean;
  owned?: boolean;
  submission?: boolean;
};

function gradeDb({
  totalMarks = 100,
  assigned = true,
  owned = false,
  submission = true,
}: Opts = {}) {
  const update = vi.fn().mockResolvedValue({ id: "sub1" });
  const db = {
    assessmentSubmission: strict("assessmentSubmission", {
      findUnique: vi.fn().mockResolvedValue(
        submission ? { assessment: { courseId: "c1", totalMarks } } : null,
      ),
      update,
    }),
    courseLecturer: strict("courseLecturer", {
      findFirst: vi.fn().mockResolvedValue(assigned ? { id: "cl1" } : null),
    }),
    course: strict("course", {
      findFirst: vi.fn().mockResolvedValue(owned ? { id: "c1" } : null),
    }),
  };
  return { db, update };
}

const lecturerCaller = (db: unknown) =>
  createCaller(
    makeCtx({
      profile: makeProfile({
        role: "LECTURER",
        lecturer: makeLecturer({ id: "lecturer-1" }),
      }),
      db,
    }),
  );

const input = (marksObtained: number) => ({
  submissionId: "sub1",
  marksObtained,
  status: "GRADED" as const,
});

describe("assessment.gradeSubmission", () => {
  it("allows the course creator who is not assigned", async () => {
    const { db, update } = gradeDb({ assigned: false, owned: true });
    await lecturerCaller(db).gradeSubmission(input(50));
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]![0]).toMatchObject({
      where: { id: "sub1" },
      data: { gradedBy: "lecturer-1", marksObtained: 50 },
    });
  });

  it("allows an assigned lecturer", async () => {
    const { db, update } = gradeDb();
    await lecturerCaller(db).gradeSubmission(input(50));
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("denies a lecturer with no access to the course", async () => {
    const { db, update } = gradeDb({ assigned: false, owned: false });
    await expect(lecturerCaller(db).gradeSubmission(input(50))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("denies a student with FORBIDDEN", async () => {
    const { db, update } = gradeDb();
    const caller = createCaller(
      makeCtx({ profile: makeProfile({ role: "STUDENT" }), db }),
    );
    await expect(caller.gradeSubmission(input(50))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects marks above totalMarks", async () => {
    const { db, update } = gradeDb({ totalMarks: 100 });
    await expect(lecturerCaller(db).gradeSubmission(input(101))).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("allows marks equal to totalMarks", async () => {
    const { db, update } = gradeDb({ totalMarks: 100 });
    await lecturerCaller(db).gradeSubmission(input(100));
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("allows any marks when totalMarks is null", async () => {
    const { db, update } = gradeDb({ totalMarks: null });
    await lecturerCaller(db).gradeSubmission(input(9999));
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("rejects marks above a totalMarks of 0", async () => {
    const { db, update } = gradeDb({ totalMarks: 0 });
    await expect(lecturerCaller(db).gradeSubmission(input(1))).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects negative marks via input validation", async () => {
    const { db, update } = gradeDb();
    await expect(lecturerCaller(db).gradeSubmission(input(-1))).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a missing submission", async () => {
    const { db, update } = gradeDb({ submission: false });
    await expect(lecturerCaller(db).gradeSubmission(input(50))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
