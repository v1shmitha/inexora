"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient  } from "~/lib/supabase/server";
import { db } from "~/server/db";

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
  institutionId: string;
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
  const supabase = createAdminClient(); // Use admin client
  const newId = generateId();

  const { data: program, error } = await supabase
    .from("Program")
    .insert({
      id: newId,
      institutionId: data.institutionId,
      title: data.title,
      slug: slugify(data.title),
      type: data.type,
      level: data.level,
      field: data.field,
      deliveryMode: data.deliveryMode,
      durationMonths: data.durationMonths ?? null,
      description: data.description ?? null,
      entryRequirements: data.entryRequirements ?? null,
      localPrice: data.localPrice ?? null,
      foreignPrice: data.foreignPrice ?? null,
      isPublished: false,
      isActive: true,
      approvalStatus: "APPROVED",
      language: ["English"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select(
      "id, title, type, level, isPublished, approvalStatus, createdAt, durationMonths, deliveryMode",
    )
    .single();

  if (error) {
    console.error("Create program error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/institution");
  return { ...program, courses: [] };
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
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("Program")
    .update({
      ...(data.title && { title: data.title }),
      ...(data.type && { type: data.type }),
      ...(data.level && { level: data.level }),
      ...(data.deliveryMode && { deliveryMode: data.deliveryMode }),
      ...(data.durationMonths && { durationMonths: data.durationMonths }),
      ...(data.description && { description: data.description }),
      ...(data.entryRequirements && {
        entryRequirements: data.entryRequirements,
      }),
      ...(data.localPrice && { localPrice: data.localPrice }),
      ...(data.foreignPrice && { foreignPrice: data.foreignPrice }),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/institution");
}

export async function toggleProgram(id: string, current: boolean) {
  const supabase = createAdminClient(); // Use admin client for database operations
  
  const { error } = await supabase
    .from("Program")
    .update({ isPublished: !current })
    .eq("id", id);
    
  if (error) {
    console.error("Toggle program error:", error);
    throw new Error(error.message);
  }
  
  revalidatePath("/institution");
}

export async function deleteProgram(id: string) {
  const supabase = createAdminClient(); // Use admin client
  
  // Delete related records first
  await supabase.from("CourseEnrollment").delete().eq("courseId", id);
  await supabase.from("CourseLecturer").delete().eq("courseId", id);
  await supabase.from("Assessment").delete().eq("courseId", id);
  await supabase.from("Course").delete().eq("programId", id);
  await supabase.from("Enrollment").delete().eq("programId", id);
  await supabase.from("Credential").delete().eq("programId", id);
  
  const { error } = await supabase.from("Program").delete().eq("id", id);
  if (error) throw new Error(error.message);
  
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
  institutionId: string;
  publishedBy: string;
  title: string;
  content?: string;
}) {
  const supabase = createAdminClient();

  const { data: ann, error } = await supabase
    .from("Announcement")
    .insert({
      id: generateId(),
      institutionId: data.institutionId,
      publishedBy: data.publishedBy,
      title: data.title,
      content: data.content ?? null,
      isPublished: false,
      targetAudience: ["all"],
    })
    .select("id, title, content, isPublished, createdAt")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/institution");
  return ann;
}

export async function toggleAnnouncement(id: string, current: boolean) {
  const supabase = createAdminClient();
  const update = current
    ? { isPublished: false, publishedAt: null }
    : { isPublished: true, publishedAt: new Date().toISOString() };
  const { error } = await supabase
    .from("Announcement")
    .update(update)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/institution");
}

export async function deleteAnnouncement(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("Announcement").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/institution");
}

// ── Institution profile ───────────────────────────────────────────────────

export async function updateInstitutionProfile(
  id: string,
  data: {
    name?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Institution")
    .update({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.website !== undefined && { website: data.website }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.city !== undefined && { city: data.city }),
      ...(data.country && { country: data.country }),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/institution");
}