import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";
import StudentDashboard from "./_components/StudentDashboard";
import LecturerDashboard from "./_components/LecturerDashboard";
import ProviderDashboard from "./_components/ProviderDashboard";
import EmployerDashboard from "./_components/EmployerDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("User:", user?.id);

  if (!user) redirect("/login");

  console.log("Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("Key preview:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20));

  const adminSupabase = createAdminClient();
  const { data: profile, error } = await adminSupabase
    .from("Profile")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("Profile:", profile);
  console.log("Profile error:", error);
  console.log("Role:", profile?.role);

  if (!profile) redirect("/login");

  switch (profile.role) {
    case "STUDENT":
      return <StudentDashboard />;
    case "LECTURER":
      return <LecturerDashboard />;
    case "INSTITUTION_ADMIN":
      return <ProviderDashboard />;
    case "EMPLOYER":
      return <EmployerDashboard />;
    case "ADMIN":
      redirect("/admin");
    default:
      redirect("/profile-setup");
  }
}
