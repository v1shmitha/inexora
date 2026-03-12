import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";
import SettingsShell from "./_components/SettingsShell";

export default async function SettingsPage() {
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

  return <SettingsShell role={profile.role} />;
}