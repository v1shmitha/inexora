import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { createAdminClient } from "~/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ manager: null });

    const adminSupabase = createAdminClient();

    // Get lecturer record
    const { data: lecturer } = await adminSupabase
      .from("Lecturer")
      .select("id")
      .eq("profileId", user.id)
      .single();

    if (!lecturer) return NextResponse.json({ manager: null });

    // Get manager entry with institution details
    const { data: manager } = await adminSupabase
      .from("InstitutionManager")
      .select(`
        id,
        canEditProfile,
        canManagePrograms,
        canViewAnalytics,
        canPostAnnouncements,
        institution:Institution (
          id, name, type, city, logoUrl, isActive
        )
      `)
      .eq("lecturerId", lecturer.id)
      .maybeSingle();

    return NextResponse.json({ manager: manager ?? null });
  } catch (err) {
    return NextResponse.json({ manager: null });
  }
}