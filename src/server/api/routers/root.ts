import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { programRouter } from "~/server/api/routers/program";
import { institutionRouter } from "~/server/api/routers/institution";
import { courseRouter } from "~/server/api/routers/course";
import { studentRouter } from "~/server/api/routers/student";
import { assessmentRouter } from "~/server/api/routers/assessment";

export const appRouter = createTRPCRouter({
  program: programRouter,
  institution: institutionRouter,
  course: courseRouter,
  student: studentRouter,
  assessment: assessmentRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);