import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";

export default async function RedirectPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("Profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "ADMIN") redirect("/admin");
  if (profile?.role === "INSTITUTION") redirect("/institution");
  redirect("/dashboard");
}