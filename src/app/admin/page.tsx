import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";
import AdminDashboard from "./components/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminSupabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalPrograms },
    { count: totalJobs },
    { data: recentUsers },
    { data: pendingInstitutions },
    { data: pendingEmployers },
    { data: pendingLecturers },
    { data: allUsers },
    { data: allPrograms },
    { data: allJobs },
    { data: allInstitutions },
    { data: approvedLecturers },
  ] = await Promise.all([
    adminSupabase.from("Profile").select("*", { count: "exact", head: true }),
    adminSupabase.from("Program").select("*", { count: "exact", head: true }),
    adminSupabase.from("JobListing").select("*", { count: "exact", head: true }),
    adminSupabase
      .from("Profile")
      .select("id, fullName, email, role, isActive, createdAt")
      .order("createdAt", { ascending: false })
      .limit(50),
    // Pending institutions: admin-created ones don't go through approval,
    // but keep this for any legacy self-registered ones
    adminSupabase
      .from("Institution")
      .select("id, name, type, country, city, createdAt")
      .eq("approvalStatus", "PENDING"),
    adminSupabase
      .from("Employer")
      .select("id, companyName, industry, createdAt, profile:Profile(fullName, email)")
      .eq("approvalStatus", "PENDING"),
    adminSupabase
      .from("Lecturer")
      .select("id, title, specialization, createdAt, profile:Profile(fullName, email)")
      .eq("approvalStatus", "PENDING"),
    adminSupabase
      .from("Profile")
      .select("id, fullName, email, role, isActive, createdAt")
      .order("createdAt", { ascending: false })
      .limit(100),
    adminSupabase
      .from("Program")
      .select("id, title, isPublished, createdAt, institution:Institution(name)")
      .order("createdAt", { ascending: false })
      .limit(100),
    adminSupabase
      .from("JobListing")
      .select("id, title, type, isActive, createdAt, employer:Employer(companyName)")
      .order("createdAt", { ascending: false })
      .limit(100),
    // All approved institutions with their managers
    adminSupabase
      .from("Institution")
      .select(`
        id, name, type, country, city, isActive, isVerified, createdAt,
        managers:InstitutionManager(
          id, canEditProfile, canManagePrograms, canViewAnalytics, canPostAnnouncements, assignedAt,
          lecturer:Lecturer(id, title, profile:Profile(fullName, email))
        )
      `)
      .eq("approvalStatus", "APPROVED")
      .order("createdAt", { ascending: false }),
    // Approved lecturers for manager assignment dropdown
    adminSupabase
      .from("Lecturer")
      .select("id, title, institutionId, profile:Profile(fullName, email)")
      .eq("approvalStatus", "APPROVED")
      .order("createdAt", { ascending: false }),
  ]);

  const stats = {
    totalUsers: totalUsers ?? 0,
    totalInstitutions: allInstitutions?.length ?? 0,
    totalPrograms: totalPrograms ?? 0,
    totalJobs: totalJobs ?? 0,
  };

  return (
    <AdminDashboard
      stats={stats}
      recentUsers={recentUsers ?? []}
      pendingInstitutions={pendingInstitutions ?? []}
      pendingEmployers={pendingEmployers ?? []}
      pendingLecturers={pendingLecturers ?? []}
      allUsers={allUsers ?? []}
      allPrograms={allPrograms ?? []}
      allJobs={allJobs ?? []}
      allInstitutions={allInstitutions ?? []}
      approvedLecturers={approvedLecturers ?? []}
      currentUserId={user?.id ?? ""}
    />
  );
}