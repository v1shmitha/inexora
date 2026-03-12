import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";
import StudentProfileSetup from "./_components/StudentProfileSetup";
import LecturerProfileSetup from "./_components/LecturerProfileSetup";
import EmployerProfileSetup from "./_components/EmployerProfileSetup";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("Profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  switch (profile.role) {
    case "STUDENT":
      return <StudentProfileSetup />;
    case "LECTURER":
      return <LecturerProfileSetup />;
    case "EMPLOYER":
      return <EmployerProfileSetup />;
    case "ADMIN":
      redirect("/admin");
    default:
      redirect("/login");
  }
}