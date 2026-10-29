import { describe, expect, it, vi } from "vitest";

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createCallerFactory } from "~/server/api/trpc";
import { libraryResourceRouter } from "~/server/api/routers/libraryResource";
import { makeCtx } from "~/test/trpc-context";

const createCaller = createCallerFactory(libraryResourceRouter);

describe("libraryResource.listPublic", () => {
  it("is callable logged out", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const caller = createCaller(
      makeCtx({ profile: null, db: { libraryResource: { findMany } } }),
    );

    await expect(caller.listPublic({})).resolves.toEqual([]);
  });

  it("never selects fileUrl or uploadedBy for the anonymous browse list", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const caller = createCaller(
      makeCtx({ profile: null, db: { libraryResource: { findMany } } }),
    );

    await caller.listPublic({ search: "calculus" });

    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0]![0] as { select?: Record<string, unknown> };
    expect(args.select).toBeDefined();
    expect(args.select).not.toHaveProperty("fileUrl");
    expect(args.select).not.toHaveProperty("uploadedBy");
  });

  it("only lists PUBLIC and PREMIUM resources, never ENROLLED", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const caller = createCaller(
      makeCtx({ profile: null, db: { libraryResource: { findMany } } }),
    );

    await caller.listPublic({});
    await caller.listPublic({ search: "calculus", type: "EBOOK" });

    expect(findMany).toHaveBeenCalledTimes(2);
    for (const call of findMany.mock.calls) {
      const args = call[0] as { where?: { accessLevel?: { in?: string[] } } };
      const levels = args.where?.accessLevel?.in;
      expect(levels).toBeDefined();
      expect([...levels!].sort()).toEqual(["PREMIUM", "PUBLIC"]);
      expect(levels).not.toContain("ENROLLED");
    }
  });
});
