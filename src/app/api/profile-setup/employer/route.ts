import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userId: string;
      companyName: string;
      industry: string | null;
      companySize: string | null;
      website: string | null;
      description: string | null;
      phone: string | null;
      city: string | null;
    };

    const supabase = createAdminClient();

    // Update profile with contact info — do NOT set isVerified
    const { error: profileError } = await supabase
      .from("Profile")
      .update({
        phone: body.phone,
        city: body.city,
      })
      .eq("id", body.userId);

    if (profileError) throw new Error(profileError.message);

    // Insert Employer with approvalStatus PENDING
    const { error: employerError } = await supabase
      .from("Employer")
      .insert({
        id: crypto.randomUUID(),
        profileId: body.userId,
        companyName: body.companyName,
        industry: body.industry,
        companySize: body.companySize,
        website: body.website,
        description: body.description,
        isVerified: false,
        approvalStatus: "PENDING",
      });

    if (employerError) throw new Error(employerError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}