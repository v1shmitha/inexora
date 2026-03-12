import { NextResponse } from "next/server";
import { createAdminClient } from "~/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      userId: string;
      phone: string | null;
      city: string | null;
      title: string | null;
      specialization: string[];
      qualifications: string | null;
      experienceYears: number | null;
      bio: string | null;
      linkedinUrl: string | null;
      institutionId: string | null;
      isVisiting: boolean;
      hourlyRate: number | null;
    };

    const supabase = createAdminClient();

    // Update profile contact info — do NOT set isVerified
    const { error: profileError } = await supabase
      .from("Profile")
      .update({
        phone: body.phone,
        city: body.city,
      })
      .eq("id", body.userId);

    if (profileError) throw new Error(profileError.message);

    // Insert Lecturer with approvalStatus PENDING
    const { error: lecturerError } = await supabase
      .from("Lecturer")
      .insert({
        id: crypto.randomUUID(),
        profileId: body.userId,
        title: body.title,
        specialization: body.specialization,
        qualifications: body.qualifications,
        experienceYears: body.experienceYears,
        bio: body.bio,
        linkedinUrl: body.linkedinUrl,
        institutionId: body.institutionId,
        isVisiting: body.isVisiting,
        hourlyRate: body.hourlyRate,
        approvalStatus: "PENDING",
        updatedAt: new Date().toISOString(),
      });

    if (lecturerError) throw new Error(lecturerError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}