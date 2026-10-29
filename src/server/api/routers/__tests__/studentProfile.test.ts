import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createCallerFactory } from "~/server/api/trpc";
import { studentProfileRouter } from "~/server/api/routers/studentProfile";
import { makeCtx, makeProfile } from "~/test/trpc-context";

const createCaller = createCallerFactory(studentProfileRouter);

describe("studentProfile.markSetupComplete", () => {
  it("lets a STUDENT mark only their own profile verified", async () => {
    const update = vi.fn().mockResolvedValue({});
    const findUnique = vi.fn().mockResolvedValue({ id: "s1" });
    const caller = createCaller(
      makeCtx({
        profile: makeProfile({ id: "student-user", role: "STUDENT" }),
        db: { profile: { update }, student: { findUnique } },
      }),
    );

    await expect(caller.markSetupComplete()).resolves.toEqual({ success: true });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({
      where: { id: "student-user" },
      data: { isVerified: true },
    });
  });

  it("denies a STUDENT with no Student row", async () => {
    const update = vi.fn();
    const findUnique = vi.fn().mockResolvedValue(null);
    const caller = createCaller(
      makeCtx({
        profile: makeProfile({ role: "STUDENT" }),
        db: { profile: { update }, student: { findUnique } },
      }),
    );

    await expect(caller.markSetupComplete()).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("denies a LECTURER", async () => {
    const update = vi.fn();
    const caller = createCaller(
      makeCtx({
        profile: makeProfile({ role: "LECTURER" }),
        db: { profile: { update } },
      }),
    );

    await expect(caller.markSetupComplete()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("denies logged-out callers", async () => {
    const update = vi.fn();
    const caller = createCaller(
      makeCtx({ profile: null, db: { profile: { update } } }),
    );

    await expect(caller.markSetupComplete()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
