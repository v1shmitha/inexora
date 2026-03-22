import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, lecturerProcedure } from "~/server/api/trpc";

const RESOURCE_TYPES = ["PDF", "VIDEO_UPLOAD", "VIDEO_LINK", "IMAGE", "PRESENTATION", "EXTERNAL_LINK"] as const;

// ── Helper: verify lecturer has access to the course ──────────────────────
async function assertCourseAccess(db: any, courseId: string, lecturerId: string) {
  const assignment = await db.courseLecturer.findFirst({
    where: { courseId, lecturerId },
  });
  const owned = await db.course.findFirst({
    where: { id: courseId, createdById: lecturerId },
  });
  if (!assignment && !owned) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this course" });
  }
}

export const courseResourceRouter = createTRPCRouter({

  // ── GET: all resources for a course ──────────────────────────────────────
  getByCourse: lecturerProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertCourseAccess(ctx.db, input.courseId, ctx.lecturer.id);
      return ctx.db.courseResource.findMany({
        where: { courseId: input.courseId },
        orderBy: { orderIndex: "asc" },
      });
    }),

  // ── CREATE: add a resource to a course ───────────────────────────────────
  create: lecturerProcedure
    .input(z.object({
      courseId:    z.string(),
      title:       z.string().min(1),
      type:        z.enum(RESOURCE_TYPES),
      fileUrl:     z.string().url().optional().nullable(),
      externalUrl: z.string().url().optional().nullable(),
      description: z.string().optional().nullable(),
      orderIndex:  z.number().int().min(0).default(0),
      isPublished: z.boolean().default(true),
      sizeBytes:   z.number().int().optional().nullable(),
      mimeType:    z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCourseAccess(ctx.db, input.courseId, ctx.lecturer.id);

      // Validate that URL type has the right field
      if (["VIDEO_LINK", "EXTERNAL_LINK"].includes(input.type) && !input.externalUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "External URL is required for this resource type" });
      }
      if (["PDF", "VIDEO_UPLOAD", "IMAGE", "PRESENTATION"].includes(input.type) && !input.fileUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "File URL is required for this resource type" });
      }

      return ctx.db.courseResource.create({ data: input });
    }),

  // ── UPDATE ────────────────────────────────────────────────────────────────
  update: lecturerProcedure
    .input(z.object({
      id:          z.string(),
      title:       z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      externalUrl: z.string().url().optional().nullable(),
      fileUrl:     z.string().url().optional().nullable(),
      orderIndex:  z.number().int().min(0).optional(),
      isPublished: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const resource = await ctx.db.courseResource.findUnique({ where: { id } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      await assertCourseAccess(ctx.db, resource.courseId, ctx.lecturer.id);
      return ctx.db.courseResource.update({ where: { id }, data });
    }),

  // ── REORDER: update orderIndex for multiple resources at once ─────────────
  reorder: lecturerProcedure
    .input(z.object({
      courseId: z.string(),
      items: z.array(z.object({ id: z.string(), orderIndex: z.number().int().min(0) })),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCourseAccess(ctx.db, input.courseId, ctx.lecturer.id);
      await Promise.all(
        input.items.map((item) =>
          ctx.db.courseResource.update({
            where: { id: item.id },
            data: { orderIndex: item.orderIndex },
          }),
        ),
      );
      return { success: true };
    }),

  // ── DELETE ────────────────────────────────────────────────────────────────
  delete: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.courseResource.findUnique({ where: { id: input.id } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      await assertCourseAccess(ctx.db, resource.courseId, ctx.lecturer.id);
      return ctx.db.courseResource.delete({ where: { id: input.id } });
    }),

  // ── TOGGLE PUBLISH ────────────────────────────────────────────────────────
  togglePublish: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resource = await ctx.db.courseResource.findUnique({ where: { id: input.id } });
      if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
      await assertCourseAccess(ctx.db, resource.courseId, ctx.lecturer.id);
      return ctx.db.courseResource.update({
        where: { id: input.id },
        data: { isPublished: !resource.isPublished },
      });
    }),
});