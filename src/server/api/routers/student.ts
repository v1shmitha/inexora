import { z } from "zod";
import { createTRPCRouter, lecturerProcedure } from "~/server/api/trpc";

export const studentRouter = createTRPCRouter({

  // ── GET: all students enrolled in this lecturer's courses/modules ──────────
  getMyStudents: lecturerProcedure.query(async ({ ctx }) => {
    // Get all course IDs this lecturer is assigned to
    const courseLecturerRows = await ctx.db.courseLecturer.findMany({
      where: { lecturerId: ctx.lecturer.id },
      select: { courseId: true },
    });
    const courseIds = courseLecturerRows.map((r) => r.courseId);

    if (courseIds.length === 0) return [];

    // Get all course enrollments for those courses
    const enrollments = await ctx.db.courseEnrollment.findMany({
      where: {
        courseId: { in: courseIds },
        status: { not: "WITHDRAWN" },
      },
      include: {
        course: { select: { id: true, title: true, isStandalone: true } },
        student: {
          include: {
            profile: {
              select: { fullName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by student
    const studentMap = new Map<string, {
      student: typeof enrollments[number]["student"];
      enrolledCourses: { courseId: string; courseTitle: string; status: string; grade: string | null; createdAt: Date }[];
    }>();

    for (const e of enrollments) {
      if (!e.student) continue;
      const existing = studentMap.get(e.student.id);
      const entry = {
        courseId: e.courseId,
        courseTitle: e.course.title,
        status: e.status,
        grade: e.grade,
        createdAt: e.createdAt,
      };
      if (existing) {
        existing.enrolledCourses.push(entry);
      } else {
        studentMap.set(e.student.id, {
          student: e.student,
          enrolledCourses: [entry],
        });
      }
    }

    return Array.from(studentMap.values());
  }),

  // ── GET: students for a specific course ───────────────────────────────────
  getStudentsByCourse: lecturerProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify lecturer is assigned to this course
      const assignment = await ctx.db.courseLecturer.findFirst({
        where: { courseId: input.courseId, lecturerId: ctx.lecturer.id },
      });
      if (!assignment) return [];

      return ctx.db.courseEnrollment.findMany({
        where: {
          courseId: input.courseId,
          status: { not: "WITHDRAWN" },
        },
        include: {
          student: {
            include: {
              profile: {
                select: { fullName: true, email: true, avatarUrl: true },
              },
              submissions: {
                where: {
                  assessment: { courseId: input.courseId },
                },
                include: {
                  assessment: { select: { title: true, totalMarks: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  // ── UPDATE: grade a student's course enrollment ───────────────────────────
  updateGrade: lecturerProcedure
    .input(z.object({
      courseEnrollmentId: z.string(),
      grade: z.string().optional().nullable(),
      gradePoints: z.number().min(0).max(4).optional().nullable(),
      status: z.enum(["ACTIVE", "COMPLETED", "FAILED", "WITHDRAWN"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { courseEnrollmentId, ...data } = input;
      return ctx.db.courseEnrollment.update({
        where: { id: courseEnrollmentId },
        data,
      });
    }),
});