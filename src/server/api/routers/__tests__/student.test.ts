import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createCallerFactory } from "~/server/api/trpc";
import { studentRouter } from "~/server/api/routers/student";
import { makeCtx, makeLecturer, makeProfile } from "~/test/trpc-context";

const createCaller = createCallerFactory(studentRouter);

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

function gradeDb(opts: { enrollment?: boolean; access?: boolean } = {}) {
  const { enrollment = true, access = true } = opts;
  const update = vi.fn().mockResolvedValue({ id: "ce1" });
  const db = {
    courseEnrollment: strict("courseEnrollment", {
      findUnique: vi
        .fn()
        .mockResolvedValue(enrollment ? { courseId: "c1" } : null),
      update,
    }),
    courseLecturer: strict("courseLecturer", {
      findFirst: vi.fn().mockResolvedValue(access ? { id: "cl1" } : null),
    }),
    course: strict("course", {
      findFirst: vi.fn().mockResolvedValue(null),
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

const input = { courseEnrollmentId: "ce1", status: "COMPLETED" as const };

describe("student.updateGrade", () => {
  it("updates the enrollment for a lecturer with course access", async () => {
    const { db, update } = gradeDb();
    await lecturerCaller(db).updateGrade(input);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]![0]).toMatchObject({
      where: { id: "ce1" },
      data: { status: "COMPLETED" },
    });
  });

  it("denies a lecturer from a different course", async () => {
    const { db, update } = gradeDb({ access: false });
    await expect(lecturerCaller(db).updateGrade(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND for a missing enrollment", async () => {
    const { db, update } = gradeDb({ enrollment: false });
    await expect(lecturerCaller(db).updateGrade(input)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("denies a student", async () => {
    const { db, update } = gradeDb();
    const caller = createCaller(
      makeCtx({ profile: makeProfile({ role: "STUDENT" }), db }),
    );
    await expect(caller.updateGrade(input)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
