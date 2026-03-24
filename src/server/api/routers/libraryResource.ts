import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, lecturerProcedure } from "~/server/api/trpc";

const RESOURCE_TYPES = [
  "EBOOK",
  "JOURNAL",
  "VIDEO_LECTURE",
  "RESEARCH_PAPER",
  "SIMULATION",
  "PAST_PAPER",
] as const;

const ACCESS_LEVELS = ["PUBLIC", "ENROLLED", "PREMIUM"] as const;

export const libraryResourceRouter = createTRPCRouter({

  // ── GET: all resources uploaded by this lecturer ──────────────────────────
  getMyResources: lecturerProcedure.query(async ({ ctx }) => {
    return ctx.db.libraryResource.findMany({
      where: { uploadedBy: ctx.lecturer.profileId },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── CREATE ────────────────────────────────────────────────────────────────
  create: lecturerProcedure
    .input(z.object({
      title:        z.string().min(1),
      type:         z.enum(RESOURCE_TYPES),
      subject:      z.string().optional().nullable(),
      field:        z.string().optional().nullable(),
      author:       z.string().optional().nullable(),
      publisher:    z.string().optional().nullable(),
      yearPublished: z.number().int().optional().nullable(),
      description:  z.string().optional().nullable(),
      fileUrl:      z.string().url().optional().nullable(),
      thumbnailUrl: z.string().url().optional().nullable(),
      isFree:       z.boolean().default(true),
      accessLevel:  z.enum(ACCESS_LEVELS).default("PUBLIC"),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.libraryResource.create({
        data: {
          ...input,
          uploadedBy: ctx.lecturer.profileId,
        },
      });
    }),

  // ── UPDATE ────────────────────────────────────────────────────────────────
  update: lecturerProcedure
    .input(z.object({
      id:           z.string(),
      title:        z.string().min(1).optional(),
      type:         z.enum(RESOURCE_TYPES).optional(),
      subject:      z.string().optional().nullable(),
      field:        z.string().optional().nullable(),
      author:       z.string().optional().nullable(),
      publisher:    z.string().optional().nullable(),
      yearPublished: z.number().int().optional().nullable(),
      description:  z.string().optional().nullable(),
      fileUrl:      z.string().url().optional().nullable(),
      isFree:       z.boolean().optional(),
      accessLevel:  z.enum(ACCESS_LEVELS).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const resource = await ctx.db.libraryResource.findUnique({ where: { id } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      if (resource.uploadedBy !== ctx.lecturer.profileId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.libraryResource.update({ where: { id }, data });
    }),

  // ── DELETE ────────────────────────────────────────────────────────────────
  delete: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.libraryResource.findUnique({ where: { id: input.id } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      if (resource.uploadedBy !== ctx.lecturer.profileId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return ctx.db.libraryResource.delete({ where: { id: input.id } });
    }),
});