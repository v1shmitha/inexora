import { z } from "zod";
import { createTRPCRouter, lecturerProcedure, publicProcedure } from "~/server/api/trpc";

export const institutionRouter = createTRPCRouter({

  // ── GET: public list of active institutions ────────────────────────────────
  // Replaces: src/app/api/institutions/list/route.ts
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.institution.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true, city: true, country: true, isActive: true },
      orderBy: { name: "asc" },
    });
  }),

  // ── GET: manager info for the current lecturer ─────────────────────────────
  // Replaces: src/app/api/institutions/manager/route.ts
  getMyManagerInfo: lecturerProcedure.query(async ({ ctx }) => {
    const managerEntry = await ctx.db.institutionManager.findFirst({
      where: { lecturerId: ctx.lecturer.id },
      select: {
        id: true,
        canEditProfile: true,
        canManagePrograms: true,
        canViewAnalytics: true,
        canPostAnnouncements: true,
        institution: {
          select: {
            id: true,
            name: true,
            type: true,
            city: true,
            logoUrl: true,
            isActive: true,
          },
        },
      },
    });

    return managerEntry ?? null;
  }),
});