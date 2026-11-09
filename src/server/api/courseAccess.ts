import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export async function assertCourseAccess(
  db: Pick<PrismaClient, "courseLecturer" | "course">,
  courseId: string,
  lecturerId: string,
) {
  const assignment = await db.courseLecturer.findFirst({
    where: { courseId, lecturerId },
  });
  const owned = await db.course.findFirst({
    where: { id: courseId, createdById: lecturerId },
  });
  if (!assignment && !owned) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this course",
    });
  }
}
