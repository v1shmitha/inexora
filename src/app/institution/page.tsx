import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";
import InstitutionDashboard from "./components/InstitutionDashboard";

export default async function InstitutionPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("Profile")
    .select("id, fullName, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "INSTITUTION") redirect("/login");

  // Use admin client to bypass RLS
  const { data: account } = await adminSupabase
    .from("InstitutionAccount")
    .select(`
      id,
      institution:Institution(
        id, name, type, description, logoUrl, website,
        email, phone, address, city, country,
        isVerified, isActive,
        programs:Program(
          id, title, type, level, isPublished, approvalStatus,
          createdAt, durationMonths, deliveryMode,
          courses:Course(id, title, code, isMandatory, orderIndex)
        ),
        lecturers:Lecturer(
          id, title, specialization, approvalStatus,
          profile:Profile(fullName, email)
        ),
        announcements:Announcement(
          id, title, content, isPublished, createdAt
        )
      )
    `)
    .eq("profileId", user.id)
    .single();

  if (!account?.institution) redirect("/login");

  const institution = Array.isArray(account.institution)
    ? account.institution[0]
    : account.institution;

  if (!institution) redirect("/login");

  return (
    <InstitutionDashboard
      profile={profile}
      institution={institution}
    />
  );
}