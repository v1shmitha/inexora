import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, lecturerProcedure } from "~/server/api/trpc";

export const courseRouter = createTRPCRouter({

  // ── GET: modules assigned to this lecturer ────────────────────────────────
  getMyModules: lecturerProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.courseLecturer.findMany({
      where: { lecturerId: ctx.lecturer.id },
      include: {
        course: {
          include: {
            program: {
              select: { id: true, title: true, type: true, field: true },
            },
            assessments: { select: { id: true } },
            courseEnrollments: { select: { id: true, status: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    return rows
      .filter((r) => !r.course.isStandalone)
      .map((r) => ({
        courseLecturerId: r.id,
        role: r.role,
        assignedAt: r.assignedAt,
        course: r.course,
      }));
  }),

  // ── GET: standalone courses created by this lecturer ──────────────────────
  getMyCourses: lecturerProcedure.query(async ({ ctx }) => {
    return ctx.db.course.findMany({
      where: {
        createdById: ctx.lecturer.id,
        isStandalone: true,
      },
      include: {
        assessments: { select: { id: true } },
        courseEnrollments: { select: { id: true, status: true } },
        courseLecturers: {
          include: {
            lecturer: {
              include: { profile: { select: { fullName: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── CREATE: standalone course ─────────────────────────────────────────────
  createCourse: lecturerProcedure
    .input(z.object({
      title: z.string().min(2),
      code: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      localPrice: z.number().positive().optional().nullable(),
      foreignPrice: z.number().positive().optional().nullable(),
      isPublished: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.create({
        data: {
          ...input,
          isStandalone: true,
          isMandatory: false,
          createdById: ctx.lecturer.id,
        },
      });
      await ctx.db.courseLecturer.create({
        data: {
          courseId: course.id,
          lecturerId: ctx.lecturer.id,
          role: "LECTURER",
        },
      });
      return course;
    }),

  // ── CREATE: module (linked to a program) ──────────────────────────────────
  createModule: lecturerProcedure
    .input(z.object({
      programId: z.string(),
      title: z.string().min(2),
      code: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      isMandatory: z.boolean().default(true),
      orderIndex: z.number().int().min(0).default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const program = await ctx.db.program.findUnique({
        where: { id: input.programId },
        select: { institutionId: true, approvalStatus: true },
      });
      if (!program) throw new TRPCError({ code: "NOT_FOUND", message: "Program not found" });
      if (program.institutionId !== ctx.lecturer.institutionId) throw new TRPCError({ code: "FORBIDDEN", message: "Program does not belong to your institution" });
      if (program.approvalStatus !== "APPROVED") throw new TRPCError({ code: "FORBIDDEN", message: "Can only add modules to approved programs" });

      const course = await ctx.db.course.create({
        data: {
          ...input,
          isStandalone: false,
          isPublished: false,
          createdById: ctx.lecturer.id,
        },
      });
      await ctx.db.courseLecturer.create({
        data: { courseId: course.id, lecturerId: ctx.lecturer.id, role: "LECTURER" },
      });
      return course;
    }),

  // ── UPDATE ────────────────────────────────────────────────────────────────
  update: lecturerProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(2).optional(),
      code: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      localPrice: z.number().positive().optional().nullable(),
      foreignPrice: z.number().positive().optional().nullable(),
      isPublished: z.boolean().optional(),
      isMandatory: z.boolean().optional(),
      orderIndex: z.number().int().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const course = await ctx.db.course.findUnique({
        where: { id },
        include: { courseLecturers: { select: { lecturerId: true } } },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const isCreator = course.createdById === ctx.lecturer.id;
      const isAssigned = course.courseLecturers.some((cl) => cl.lecturerId === ctx.lecturer.id);
      if (!isCreator && !isAssigned) throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit courses you created" });
      return ctx.db.course.update({ where: { id }, data });
    }),

  // ── TOGGLE PUBLISH ────────────────────────────────────────────────────────
  togglePublish: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
        include: { courseLecturers: { select: { lecturerId: true } } },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const isCreator = course.createdById === ctx.lecturer.id;
      const isAssigned = course.courseLecturers.some((cl) => cl.lecturerId === ctx.lecturer.id);
      if (!isCreator && !isAssigned) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.db.course.update({ where: { id: input.id }, data: { isPublished: !course.isPublished } });
    }),

  // ── DELETE ────────────────────────────────────────────────────────────────
  delete: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { id: input.id },
        include: { courseLecturers: { select: { lecturerId: true } } },
      });
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const isCreator = course.createdById === ctx.lecturer.id;
      const isAssigned = course.courseLecturers.some((cl) => cl.lecturerId === ctx.lecturer.id);
      if (!isCreator && !isAssigned) throw new TRPCError({ code: "FORBIDDEN" });
      await ctx.db.courseLecturer.deleteMany({ where: { courseId: input.id } });
      await ctx.db.assessment.deleteMany({ where: { courseId: input.id } });
      return ctx.db.course.delete({ where: { id: input.id } });
    }),
});