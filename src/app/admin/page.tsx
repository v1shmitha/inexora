import { createClient } from "~/lib/supabase/server";
import AdminDashboard from "./components/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: totalInstitutions },
    { count: totalPrograms },
    { count: totalJobs },
    { data: recentUsers },
    { data: pendingInstitutions },
  ] = await Promise.all([
    supabase.from("Profile").select("*", { count: "exact", head: true }),
    supabase.from("Institution").select("*", { count: "exact", head: true }),
    supabase.from("Program").select("*", { count: "exact", head: true }),
    supabase.from("JobListing").select("*", { count: "exact", head: true }),
    supabase
      .from("Profile")
      .select("id, fullName, role, createdAt")
      .order("createdAt", { ascending: false })
      .limit(5),
    supabase
      .from("Institution")
      .select("id, name, type, country, createdAt")
      .eq("isVerified", false)
      .eq("isActive", true)
      .limit(5),
  ]);

  const stats = {
    totalUsers: totalUsers ?? 0,
    totalInstitutions: totalInstitutions ?? 0,
    totalPrograms: totalPrograms ?? 0,
    totalJobs: totalJobs ?? 0,
  };

  return (
    <AdminDashboard
      stats={stats}
      recentUsers={recentUsers ?? []}
      pendingInstitutions={pendingInstitutions ?? []}
    />
  );
}