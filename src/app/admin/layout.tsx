import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("Profile")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return <>{children}</>;
}