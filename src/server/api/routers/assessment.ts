import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, lecturerProcedure } from "~/server/api/trpc";

export const assessmentRouter = createTRPCRouter({

  // ── GET: all assessments across lecturer's courses ─────────────────────────
  getMyAssessments: lecturerProcedure.query(async ({ ctx }) => {
    const courseLecturerRows = await ctx.db.courseLecturer.findMany({
      where: { lecturerId: ctx.lecturer.id },
      select: { courseId: true },
    });
    const courseIds = courseLecturerRows.map((r) => r.courseId);
    if (courseIds.length === 0) return [];

    return ctx.db.assessment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          select: { id: true, status: true, marksObtained: true },
        },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
  }),

  // ── GET: assessments for a specific course ────────────────────────────────
  getByCourse: lecturerProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignment = await ctx.db.courseLecturer.findFirst({
        where: { courseId: input.courseId, lecturerId: ctx.lecturer.id },
      });
      if (!assignment) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.assessment.findMany({
        where: { courseId: input.courseId },
        include: {
          submissions: {
            include: {
              student: {
                include: {
                  profile: { select: { fullName: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { dueDate: "asc" },
      });
    }),

  // ── CREATE: assessment ────────────────────────────────────────────────────
  create: lecturerProcedure
    .input(z.object({
      courseId: z.string(),
      title: z.string().min(2),
      type: z.enum(["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT", "PRESENTATION"]),
      totalMarks: z.number().int().positive().optional().nullable(),
      passMarks: z.number().int().positive().optional().nullable(),
      weightPercent: z.number().min(0).max(100).optional().nullable(),
      dueDate: z.string().datetime().optional().nullable(),
      instructions: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify lecturer is assigned to this course
      const assignment = await ctx.db.courseLecturer.findFirst({
        where: { courseId: input.courseId, lecturerId: ctx.lecturer.id },
      });
      if (!assignment) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not assigned to this course" });
      }

      return ctx.db.assessment.create({
        data: {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
      });
    }),

  // ── UPDATE: assessment ────────────────────────────────────────────────────
  update: lecturerProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(2).optional(),
      type: z.enum(["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT", "PRESENTATION"]).optional(),
      totalMarks: z.number().int().positive().optional().nullable(),
      passMarks: z.number().int().positive().optional().nullable(),
      weightPercent: z.number().min(0).max(100).optional().nullable(),
      dueDate: z.string().datetime().optional().nullable(),
      instructions: z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, ...rest } = input;

      const assessment = await ctx.db.assessment.findUnique({
        where: { id },
        include: { course: { select: { courseLecturers: { select: { lecturerId: true } } } } },
      });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      const isAssigned = assessment.course.courseLecturers.some(
        (cl) => cl.lecturerId === ctx.lecturer.id,
      );
      if (!isAssigned) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.assessment.update({
        where: { id },
        data: {
          ...rest,
          ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
        },
      });
    }),

  // ── DELETE: assessment ────────────────────────────────────────────────────
  delete: lecturerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const assessment = await ctx.db.assessment.findUnique({
        where: { id: input.id },
        include: { course: { select: { courseLecturers: { select: { lecturerId: true } } } } },
      });
      if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });

      const isAssigned = assessment.course.courseLecturers.some(
        (cl) => cl.lecturerId === ctx.lecturer.id,
      );
      if (!isAssigned) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.assessment.delete({ where: { id: input.id } });
    }),

  // ── GRADE: submission ─────────────────────────────────────────────────────
  gradeSubmission: lecturerProcedure
    .input(z.object({
      submissionId: z.string(),
      marksObtained: z.number().min(0),
      feedback: z.string().optional().nullable(),
      status: z.enum(["GRADED", "RESUBMIT_REQUIRED"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { submissionId, ...data } = input;
      return ctx.db.assessmentSubmission.update({
        where: { id: submissionId },
        data: {
          ...data,
          gradedBy: ctx.lecturer.id,
          gradedAt: new Date(),
        },
      });
    }),

  // ── GET: pending submissions to grade ─────────────────────────────────────
  getPendingSubmissions: lecturerProcedure.query(async ({ ctx }) => {
    const courseLecturerRows = await ctx.db.courseLecturer.findMany({
      where: { lecturerId: ctx.lecturer.id },
      select: { courseId: true },
    });
    const courseIds = courseLecturerRows.map((r) => r.courseId);
    if (courseIds.length === 0) return [];

    return ctx.db.assessmentSubmission.findMany({
      where: {
        status: "SUBMITTED",
        assessment: { courseId: { in: courseIds } },
      },
      include: {
        assessment: {
          select: { title: true, totalMarks: true, course: { select: { title: true } } },
        },
        student: {
          include: {
            profile: { select: { fullName: true, email: true } },
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });
  }),
});