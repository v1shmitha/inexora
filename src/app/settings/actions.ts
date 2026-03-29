"use server";

import { createAdminClient } from "~/lib/supabase/admin";
import { createClient } from "~/lib/supabase/server";

export async function deleteOwnAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const id = user.id;

  // 1. Get role-specific record IDs first
  const { data: student } = await admin.from("Student").select("id").eq("profileId", id).single();
  const { data: lecturer } = await admin.from("Lecturer").select("id").eq("profileId", id).single();
  const { data: employer } = await admin.from("Employer").select("id").eq("profileId", id).single();

  // 2. Delete student-related data
  if (student) {
    await admin.from("AssessmentSubmission").delete().eq("studentId", student.id);
    await admin.from("JobApplication").delete().eq("studentId", student.id);

    const { data: enrollments } = await admin
      .from("Enrollment")
      .select("id")
      .eq("studentId", student.id);

    if (enrollments && enrollments.length > 0) {
      const enrollmentIds = enrollments.map((e) => e.id);
      await admin.from("CourseEnrollment").delete().in("enrollmentId", enrollmentIds);
      await admin.from("Credential").delete().in("enrollmentId", enrollmentIds);
      await admin.from("Payment").delete().in("enrollmentId", enrollmentIds);
      await admin.from("Enrollment").delete().eq("studentId", student.id);
    }

    await admin.from("Credential").delete().eq("studentId", student.id);
    await admin.from("Student").delete().eq("profileId", id);
  }

  // 3. Delete lecturer-related data
  if (lecturer) {
    await admin.from("CourseLecturer").delete().eq("lecturerId", lecturer.id);
    await admin.from("Lecturer").delete().eq("profileId", id);
  }

  // 4. Delete employer-related data
  if (employer) {
    const { data: jobs } = await admin
      .from("JobListing")
      .select("id")
      .eq("employerId", employer.id);

    if (jobs && jobs.length > 0) {
      const jobIds = jobs.map((j) => j.id);
      await admin.from("JobApplication").delete().in("jobId", jobIds);
      await admin.from("JobListing").delete().eq("employerId", employer.id);
    }

    await admin.from("Employer").delete().eq("profileId", id);
  }

  // 5. Delete remaining profile-level data
  await admin.from("Notification").delete().eq("profileId", id);
  await admin.from("Subscription").delete().eq("profileId", id);
  await admin.from("Payment").delete().eq("profileId", id);
  await admin.from("Announcement").delete().eq("publishedBy", id);

  // 6. Nullify institution admin reference if this user runs one
  await admin.from("Institution").update({ adminId: null }).eq("adminId", id);

  // 7. Finally delete the Profile row
  const { error: profileError } = await admin.from("Profile").delete().eq("id", id);
  if (profileError) throw new Error(profileError.message);

  // 8. Delete from Supabase Auth
  const { error: authError } = await admin.auth.admin.deleteUser(id);
  if (authError && !authError.message.includes("User not found")) {
    throw new Error(authError.message);
  }
}