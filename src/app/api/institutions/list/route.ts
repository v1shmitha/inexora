import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("Institution")
      .select("id, name, type, city, country, isActive")
      .eq("isActive", true)
      .order("name");

    if (error) throw new Error(error.message);
    return NextResponse.json({ institutions: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", institutions: [] },
      { status: 500 }
    );
  }
}