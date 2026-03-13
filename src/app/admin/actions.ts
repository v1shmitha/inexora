"use server";

import { createAdminClient } from "~/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ── Users ──────────────────────────────────────────────────────────────────

export async function suspendUser(id: string) {
  const supabase = createAdminClient();

  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: false })
    .eq("id", id);
  if (profileError) throw new Error(profileError.message);

  const { error: banError } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: "876600h",
  });
  if (banError) throw new Error(banError.message);

  revalidatePath("/admin");
}

export async function reactivateUser(id: string) {
  const supabase = createAdminClient();

  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: true })
    .eq("id", id);
  if (profileError) throw new Error(profileError.message);

  const { error: banError } = await supabase.auth.admin.updateUserById(id, {
    ban_duration: "none",
  });
  if (banError) throw new Error(banError.message);

  revalidatePath("/admin");
}

export async function deleteUser(id: string) {
  console.log("deleteUser called with id:", id);
  const supabase = createAdminClient();

  const { data: students } = await supabase
    .from("Student")
    .select("id")
    .eq("profileId", id);
  const { data: lecturers } = await supabase
    .from("Lecturer")
    .select("id")
    .eq("profileId", id);
  const { data: employers } = await supabase
    .from("Employer")
    .select("id")
    .eq("profileId", id);

  const student = students?.[0] ?? null;
  const lecturer = lecturers?.[0] ?? null;
  const employer = employers?.[0] ?? null;

  console.log(
    "student:",
    student,
    "lecturer:",
    lecturer,
    "employer:",
    employer,
  );

  if (student) {
    await supabase
      .from("AssessmentSubmission")
      .delete()
      .eq("studentId", student.id);
    await supabase.from("JobApplication").delete().eq("studentId", student.id);

    const { data: enrollments } = await supabase
      .from("Enrollment")
      .select("id")
      .eq("studentId", student.id);

    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map((e) => e.id);
      await supabase
        .from("CourseEnrollment")
        .delete()
        .in("enrollmentId", enrollmentIds);
      await supabase
        .from("Credential")
        .delete()
        .in("enrollmentId", enrollmentIds);
      await supabase.from("Payment").delete().in("enrollmentId", enrollmentIds);
      await supabase.from("Enrollment").delete().eq("studentId", student.id);
    }

    await supabase.from("Credential").delete().eq("studentId", student.id);
    await supabase.from("Student").delete().eq("profileId", id);
  }

  if (lecturer) {
    await supabase
      .from("InstitutionManager")
      .delete()
      .eq("lecturerId", lecturer.id);
    await supabase
      .from("CourseLecturer")
      .delete()
      .eq("lecturerId", lecturer.id);
    await supabase.from("Lecturer").delete().eq("profileId", id);
  }

  if (employer) {
    const { data: jobs } = await supabase
      .from("JobListing")
      .select("id")
      .eq("employerId", employer.id);

    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map((j) => j.id);
      await supabase.from("JobApplication").delete().in("jobId", jobIds);
      await supabase.from("JobListing").delete().eq("employerId", employer.id);
    }

    await supabase.from("Employer").delete().eq("profileId", id);
  }

  await supabase.from("Notification").delete().eq("profileId", id);
  await supabase.from("Subscription").delete().eq("profileId", id);
  await supabase.from("Payment").delete().eq("profileId", id);
  await supabase.from("Announcement").delete().eq("publishedBy", id);

  console.log("Reached Profile delete");
  const { error: profileError } = await supabase
    .from("Profile")
    .delete()
    .eq("id", id);
  console.log("Profile delete:", profileError?.message ?? "ok");

  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  console.log("Auth delete:", authError?.message ?? "ok");
  if (authError && !authError.message.includes("User not found")) {
    throw new Error(authError.message);
  }

  revalidatePath("/admin");
}

// ── Lecturers ──────────────────────────────────────────────────────────────

export async function approveLecturer(id: string) {
  const supabase = createAdminClient();

  // Get profileId from Lecturer row
  const { data: lec, error: fetchError } = await supabase
    .from("Lecturer")
    .select("profileId")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  // Activate the Profile
  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: true, isVerified: true })
    .eq("id", lec.profileId);
  if (profileError) throw new Error(profileError.message);

  // Approve the Lecturer
  const { error } = await supabase
    .from("Lecturer")
    .update({ approvalStatus: "APPROVED" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function rejectLecturer(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Lecturer")
    .update({ approvalStatus: "REJECTED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Institutions ───────────────────────────────────────────────────────────

export async function approveInstitution(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Institution")
    .update({ isVerified: true, isActive: true, approvalStatus: "APPROVED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function rejectInstitution(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Institution")
    .update({ isActive: false, approvalStatus: "REJECTED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function suspendInstitution(id: string) {
  const supabase = createAdminClient();

  console.log("Suspending institution id:", id);

  const { data, error } = await supabase
    .from("Institution")
    .update({ isActive: false })
    .eq("id", id)
    .select();

  console.log("Affected rows:", data);
  console.log("Error:", error);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function reactivateInstitution(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Institution")
    .update({ isActive: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteInstitution(id: string) {
  const supabase = createAdminClient();
  // CASCADE on FK handles InstitutionManager rows
  const { error } = await supabase.from("Institution").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createInstitution(data: {
  name: string;
  type: string;
  country: string;
  city?: string;
  website?: string;
  description?: string;
}) {
  const supabase = createAdminClient();

  const baseSlug = data.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-"); // collapse multiple hyphens

  // Append a short random suffix to avoid collisions
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: newInst, error } = await supabase
    .from("Institution")
    .insert({
      id: crypto.randomUUID(),
      name: data.name,
      slug,
      type: data.type,
      country: data.country,
      city: data.city ?? null,
      website: data.website ?? null,
      description: data.description ?? null,
      isActive: true,
      isVerified: true,
      approvalStatus: "APPROVED",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  // revalidatePath("/admin");
  return newInst;
}

export async function updateInstitution(
  id: string,
  data: {
    name?: string;
    type?: string;
    country?: string;
    city?: string;
    website?: string;
    description?: string;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Institution")
    .update({ ...data, updatedAt: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Employers ──────────────────────────────────────────────────────────────

export async function approveEmployer(id: string) {
  const supabase = createAdminClient();

  const { data: emp, error: fetchError } = await supabase
    .from("Employer")
    .select("profileId")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  // Activate the Profile
  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: true, isVerified: true })
    .eq("id", emp.profileId);
  if (profileError) throw new Error(profileError.message);

  // Approve the Employer
  const { error } = await supabase
    .from("Employer")
    .update({ isVerified: true, approvalStatus: "APPROVED" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function rejectEmployer(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Employer")
    .update({ isVerified: false, approvalStatus: "REJECTED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Re-approve rejected ────────────────────────────────────────────────────

export async function reApproveLecturer(id: string) {
  const supabase = createAdminClient();

  const { data: lec, error: fetchError } = await supabase
    .from("Lecturer")
    .select("profileId")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: true, isVerified: true })
    .eq("id", lec.profileId);
  if (profileError) throw new Error(profileError.message);

  const { error } = await supabase
    .from("Lecturer")
    .update({ approvalStatus: "APPROVED" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function reApproveEmployer(id: string) {
  const supabase = createAdminClient();

  const { data: emp, error: fetchError } = await supabase
    .from("Employer")
    .select("profileId")
    .eq("id", id)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  const { error: profileError } = await supabase
    .from("Profile")
    .update({ isActive: true, isVerified: true })
    .eq("id", emp.profileId);
  if (profileError) throw new Error(profileError.message);

  const { error } = await supabase
    .from("Employer")
    .update({ isVerified: true, approvalStatus: "APPROVED" })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

// ── Programs ───────────────────────────────────────────────────────────────

export async function toggleProgram(id: string, current: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("Program")
    .update({ isPublished: !current })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteProgram(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("Program").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export async function toggleJob(id: string, current: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("JobListing")
    .update({ isActive: !current })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteJob(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("JobListing").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

// ── Institution Managers ───────────────────────────────────────────────────

export async function assignManager(data: {
  institutionId: string;
  lecturerId: string;
  canEditProfile?: boolean;
  canManagePrograms?: boolean;
  canViewAnalytics?: boolean;
  canPostAnnouncements?: boolean;
  assignedBy?: string;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("InstitutionManager").insert({
    id: crypto.randomUUID(),
    institutionId: data.institutionId,
    lecturerId: data.lecturerId,
    canEditProfile: data.canEditProfile ?? false,
    canManagePrograms: data.canManagePrograms ?? true,
    canViewAnalytics: data.canViewAnalytics ?? true,
    canPostAnnouncements: data.canPostAnnouncements ?? false,
    assignedAt: new Date().toISOString(),
    assignedBy: data.assignedBy ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function removeManager(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("InstitutionManager")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateManagerPermissions(
  id: string,
  perms: {
    canEditProfile: boolean;
    canManagePrograms: boolean;
    canViewAnalytics: boolean;
    canPostAnnouncements: boolean;
  },
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("InstitutionManager")
    .update(perms)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
