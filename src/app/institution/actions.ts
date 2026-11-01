"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DeliveryMode, ProgramLevel, ProgramType } from "@prisma/client";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient  } from "~/lib/supabase/server";
import { priceUsdFields } from "~/lib/pricing";
import { requireInstitution, type InstitutionCaller } from "~/server/auth/institution";
import { db } from "~/server/db";

// Non-async exports are not allowed in a "use server" file, so these
// helpers stay file-local.
const idSchema = z.string().min(1, "Invalid id");
const flagSchema = z.boolean();

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid input");
  }
  return result.data;
}

const createProgramSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.nativeEnum(ProgramType),
  level: z.nativeEnum(ProgramLevel),
  field: z.literal("OTHER"),
  deliveryMode: z.nativeEnum(DeliveryMode),
  durationMonths: z.number().int().positive().optional(),
  description: z.string().optional(),
  entryRequirements: z.string().optional(),
  localPrice: z.number().positive().optional(),
  foreignPrice: z.number().positive().optional(),
});

const updateProgramSchema = z.object({
  title: z.string().trim().optional(),
  type: z.nativeEnum(ProgramType).optional(),
  level: z.nativeEnum(ProgramLevel).optional(),
  deliveryMode: z.nativeEnum(DeliveryMode).optional(),
  durationMonths: z.number().int().positive().optional(),
  description: z.string().optional(),
  entryRequirements: z.string().optional(),
  localPrice: z.number().positive().optional(),
  foreignPrice: z.number().positive().optional(),
});

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().optional(),
});

const emailSchema = z
  .string()
  .email("Invalid email")
  .optional()
  .or(z.literal(""));

const institutionProfileSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  email: emailSchema,
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

// Same error for a missing row and another institution's row, so ids
// cannot be probed across institutions.
async function loadOwnedProgram(id: string, caller: InstitutionCaller) {
  const row = await db.program.findUnique({
    where: { id },
    select: { institutionId: true, isPublished: true },
  });
  if (row?.institutionId !== caller.institutionId) {
    throw new Error("Not found");
  }
  return row;
}

async function loadOwnedAnnouncement(id: string, caller: InstitutionCaller) {
  const row = await db.announcement.findUnique({
    where: { id },
    select: { institutionId: true, isPublished: true },
  });
  if (row?.institutionId !== caller.institutionId) {
    throw new Error("Not found");
  }
  return row;
}

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

// ── Programs ──────────────────────────────────────────────────────────────

export async function createProgram(data: {
  title: string;
  type: string;
  level: string;
  field: string;
  deliveryMode: string;
  durationMonths?: number;
  description?: string;
  entryRequirements?: string;
  localPrice?: number;
  foreignPrice?: number;
}) {
  const caller = await requireInstitution();
  const input = parse(createProgramSchema, data);

  const program = await db.program.create({
    data: {
      institutionId: caller.institutionId,
      title: input.title,
      slug: slugify(input.title),
      type: input.type,
      level: input.level,
      field: input.field,
      deliveryMode: input.deliveryMode,
      durationMonths: input.durationMonths ?? null,
      description: input.description ?? null,
      entryRequirements: input.entryRequirements ?? null,
      localPrice: input.localPrice ?? null,
      foreignPrice: input.foreignPrice ?? null,
      isPublished: false,
      isActive: true,
      approvalStatus: "APPROVED",
      language: ["English"],
      ...priceUsdFields(input.foreignPrice),
    },
    select: {
      id: true,
      title: true,
      type: true,
      level: true,
      isPublished: true,
      approvalStatus: true,
      createdAt: true,
      durationMonths: true,
      deliveryMode: true,
    },
  });

  revalidatePath("/institution");
  return { ...program, createdAt: program.createdAt.toISOString(), courses: [] };
}

export async function updateProgram(
  id: string,
  data: {
    title?: string;
    type?: string;
    level?: string;
    deliveryMode?: string;
    durationMonths?: number;
    description?: string;
    entryRequirements?: string;
    localPrice?: number;
    foreignPrice?: number;
  },
) {
  const caller = await requireInstitution();
  parse(idSchema, id);
  const input = parse(updateProgramSchema, data);
  await loadOwnedProgram(id, caller);

  await db.program.update({
    where: { id },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.type && { type: input.type }),
      ...(input.level && { level: input.level }),
      ...(input.deliveryMode && { deliveryMode: input.deliveryMode }),
      ...(input.durationMonths && { durationMonths: input.durationMonths }),
      ...(input.description && { description: input.description }),
      ...(input.entryRequirements && {
        entryRequirements: input.entryRequirements,
      }),
      ...(input.localPrice && { localPrice: input.localPrice }),
      ...(input.foreignPrice && {
        foreignPrice: input.foreignPrice,
        ...priceUsdFields(input.foreignPrice),
      }),
    },
  });

  revalidatePath("/institution");
}

export async function toggleProgram(id: string, current: boolean) {
  const caller = await requireInstitution();
  parse(idSchema, id);
  parse(flagSchema, current);
  // The new state comes from the stored row, not the client view of it.
  const row = await loadOwnedProgram(id, caller);

  await db.program.update({
    where: { id },
    data: { isPublished: !row.isPublished },
  });

  revalidatePath("/institution");
}

export async function deleteProgram(id: string) {
  const caller = await requireInstitution();
  parse(idSchema, id);
  await loadOwnedProgram(id, caller);

  await db.$transaction(async (tx) => {
    const enrollments = await tx.enrollment.count({ where: { programId: id } });
    const courseEnrollments = await tx.courseEnrollment.count({
      where: { course: { programId: id } },
    });
    const credentials = await tx.credential.count({ where: { programId: id } });
    const submissions = await tx.assessmentSubmission.count({
      where: { assessment: { course: { programId: id } } },
    });
    if (enrollments + courseEnrollments + credentials + submissions > 0) {
      throw new Error(
        "Cannot delete a program that has enrollments, credentials or submissions. Unpublish it instead.",
      );
    }

    await tx.assessment.deleteMany({ where: { course: { programId: id } } });
    await tx.courseLecturer.deleteMany({ where: { course: { programId: id } } });
    await tx.course.deleteMany({ where: { programId: id } });
    await tx.announcement.deleteMany({ where: { programId: id } });
    await tx.program.delete({ where: { id } });
  });

  revalidatePath("/institution");
}

//  ── Approve/Reject Lecturers ─────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient(); // Remove await - createAdminClient is not async
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("Profile")
    .select("id, fullName, email, role")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // If the user is a lecturer, get their lecturer record
  let lecturerId = null;
  if (profile.role === "LECTURER") {
    const { data: lecturer } = await supabase
      .from("Lecturer")
      .select("id")
      .eq("profileId", profile.id)
      .single();
    
    lecturerId = lecturer?.id ?? null;
  }

  return {
    ...profile,
    lecturerId,
  };
}

export async function approveLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  
  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId },
  });

  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  // Check if user is ADMIN
  if (user.role === "ADMIN") {
    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "APPROVED" },
    });
    revalidatePath("/admin");
    revalidatePath("/institution");
    return;
  }

  // Check if user is an INSTITUTION account managing this institution
  if (user.role === "INSTITUTION") {
    const account = await db.institutionAccount.findFirst({
      where: {
        profileId: user.id,
        institutionId: lecturer.institutionId
      }
    });

    if (!account) {
      throw new Error("Unauthorized: You do not manage this institution");
    }

    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "APPROVED" },
    });

    revalidatePath("/institution");
    return;
  }

  throw new Error("Unauthorized");
}

export async function rejectLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  
  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId }
  });

  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  // Check if user is ADMIN
  if (user.role === "ADMIN") {
    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "REJECTED" }
    });
    revalidatePath("/admin");
    revalidatePath("/institution");
    return;
  }

  // Check if user is an INSTITUTION account managing this institution
  if (user.role === "INSTITUTION") {
    const account = await db.institutionAccount.findFirst({
      where: {
        profileId: user.id,
        institutionId: lecturer.institutionId
      }
    });

    if (!account) {
      throw new Error("Unauthorized: You do not manage this institution");
    }

    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "REJECTED" }
    });

    revalidatePath("/institution");
    return;
  }

  throw new Error("Unauthorized");
}

export async function reApproveLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  
  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId }
  });

  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  if (lecturer.approvalStatus !== "REJECTED") {
    throw new Error("Lecturer is not in rejected status");
  }

  // Check if user is ADMIN
  if (user.role === "ADMIN") {
    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "APPROVED" }
    });
    revalidatePath("/admin");
    revalidatePath("/institution");
    return;
  }

  // Check if user is an INSTITUTION account managing this institution
  if (user.role === "INSTITUTION") {
    const account = await db.institutionAccount.findFirst({
      where: {
        profileId: user.id,
        institutionId: lecturer.institutionId
      }
    });

    if (!account) {
      throw new Error("Unauthorized: You do not manage this institution");
    }

    await db.lecturer.update({
      where: { id: lecturerId },
      data: { approvalStatus: "APPROVED" }
    });

    revalidatePath("/institution");
    return;
  }

  throw new Error("Unauthorized");
}

// ── Suspend / Delete Lecturer (Institution) ───────────────────────────────

export async function suspendLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  const supabase = createAdminClient();

  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId },
    include: { profile: { select: { id: true } } },
  });
  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  const authorized =
    user.role === "ADMIN" ||
    (user.role === "INSTITUTION" &&
      !!(await db.institutionAccount.findFirst({
        where: { profileId: user.id, institutionId: lecturer.institutionId },
      })));
  if (!authorized) throw new Error("Unauthorized");

  const authUserId = lecturer.profileId;

  // Sync both tables
  await db.lecturer.update({
    where: { id: lecturerId },
    data: { approvalStatus: "SUSPENDED" },
  });
  await db.profile.update({
    where: { id: authUserId },
    data: { isActive: false },
  });

  // Block login via Supabase Auth
  await supabase.auth.admin.updateUserById(authUserId, {
    ban_duration: "876600h",
  });

  revalidatePath("/institution");
  revalidatePath("/admin");
}

export async function reinstateLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  const supabase = createAdminClient();

  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId },
    include: { profile: { select: { id: true } } },
  });
  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  const authorized =
    user.role === "ADMIN" ||
    (user.role === "INSTITUTION" &&
      !!(await db.institutionAccount.findFirst({
        where: { profileId: user.id, institutionId: lecturer.institutionId },
      })));
  if (!authorized) throw new Error("Unauthorized");

  const authUserId = lecturer.profileId;

  // Sync both tables
  await db.lecturer.update({
    where: { id: lecturerId },
    data: { approvalStatus: "APPROVED" },
  });
  await db.profile.update({
    where: { id: authUserId },
    data: { isActive: true },
  });

  // Restore login
  await supabase.auth.admin.updateUserById(authUserId, {
    ban_duration: "none",
  });

  revalidatePath("/institution");
  revalidatePath("/admin");
}

export async function deleteLecturer(lecturerId: string) {
  const user = await getCurrentUser();
  const supabase = createAdminClient();

  const lecturer = await db.lecturer.findUnique({
    where: { id: lecturerId },
    include: { profile: { select: { id: true } } },
  });
  if (!lecturer) throw new Error("Lecturer not found");
  if (!lecturer.institutionId) throw new Error("Lecturer has no institution");

  const authorized =
    user.role === "ADMIN" ||
    (user.role === "INSTITUTION" &&
      !!(await db.institutionAccount.findFirst({
        where: { profileId: user.id, institutionId: lecturer.institutionId },
      })));
  if (!authorized) throw new Error("Unauthorized");

  const authUserId = lecturer.profile?.id ?? lecturer.profileId;

  // 1. Clean up related records first
  await db.courseLecturer.deleteMany({ where: { lecturerId } });
  await db.institutionManager.deleteMany({ where: { lecturerId } });

  // 2. Delete the Lecturer row
  await db.lecturer.delete({ where: { id: lecturerId } });

  // 3. Delete the Profile row
  await db.profile.delete({ where: { id: authUserId } });

  // 4. Delete the Supabase Auth user — blocks all future logins
  const { error } = await supabase.auth.admin.deleteUser(authUserId);
  if (error) throw new Error(`Auth delete failed: ${error.message}`);

  revalidatePath("/institution");
  revalidatePath("/admin");
}

// ── Announcements ─────────────────────────────────────────────────────────

export async function createAnnouncement(data: {
  title: string;
  content?: string;
}) {
  const caller = await requireInstitution();
  const input = parse(createAnnouncementSchema, data);

  const ann = await db.announcement.create({
    data: {
      institutionId: caller.institutionId,
      publishedBy: caller.profileId,
      title: input.title,
      content: input.content ?? null,
      isPublished: false,
      targetAudience: ["all"],
    },
    select: {
      id: true,
      title: true,
      content: true,
      isPublished: true,
      createdAt: true,
    },
  });

  revalidatePath("/institution");
  return { ...ann, createdAt: ann.createdAt.toISOString() };
}

export async function toggleAnnouncement(id: string, current: boolean) {
  const caller = await requireInstitution();
  parse(idSchema, id);
  parse(flagSchema, current);
  const row = await loadOwnedAnnouncement(id, caller);

  await db.announcement.update({
    where: { id },
    data: row.isPublished
      ? { isPublished: false, publishedAt: null }
      : { isPublished: true, publishedAt: new Date() },
  });

  revalidatePath("/institution");
}

export async function deleteAnnouncement(id: string) {
  const caller = await requireInstitution();
  parse(idSchema, id);
  await loadOwnedAnnouncement(id, caller);

  await db.announcement.delete({ where: { id } });
  revalidatePath("/institution");
}

// ── Institution profile ───────────────────────────────────────────────────

export async function updateInstitutionProfile(data: {
  name?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}) {
  const caller = await requireInstitution();
  const input = parse(institutionProfileSchema, data);

  await db.institution.update({
    where: { id: caller.institutionId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.country && { country: input.country }),
    },
  });

  revalidatePath("/institution");
}
