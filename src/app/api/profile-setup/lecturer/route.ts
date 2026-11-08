import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "~/lib/supabase/admin";
import { requireProfileRole } from "~/server/auth/admin";

const nullableStr = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => v ?? null);

const lecturerSetupSchema = z.object({
  phone: nullableStr(40),
  city: nullableStr(100),
  title: nullableStr(200),
  specialization: z.array(z.string().max(100)).max(50).default([]),
  qualifications: nullableStr(2000),
  experienceYears: z
    .number()
    .int()
    .min(0)
    .max(80)
    .nullish()
    .transform((v) => v ?? null),
  bio: nullableStr(5000),
  linkedinUrl: nullableStr(500),
  institutionId: nullableStr(100),
  isVisiting: z.boolean().default(false),
  hourlyRate: z
    .number()
    .min(0)
    .max(1_000_000)
    .nullish()
    .transform((v) => v ?? null),
});

export async function POST(request: Request) {
  const auth = await requireProfileRole("LECTURER");
  if ("response" in auth) return auth.response;
  const userId = auth.profile.id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = lecturerSetupSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const supabase = createAdminClient();

    // Update profile contact info — do NOT set isVerified
    const { error: profileError } = await supabase
      .from("Profile")
      .update({
        phone: body.phone,
        city: body.city,
      })
      .eq("id", userId);

    if (profileError) throw new Error(profileError.message);

    // Re-submitting (editing an existing profile) must not silently reset an
    // approved lecturer's status — only the fields admins actually vet
    // (credentials, not bio/contact polish) trigger re-review.
    const { data: existingRaw } = await supabase
      .from("Lecturer")
      .select("id, approvalStatus, title, specialization, qualifications, experienceYears, institutionId")
      .eq("profileId", userId)
      .maybeSingle();

    const existing = existingRaw as {
      id: string;
      approvalStatus: string;
      title: string | null;
      specialization: string[];
      qualifications: string | null;
      experienceYears: number | null;
      institutionId: string | null;
    } | null;

    const keyFieldsChanged =
      existing?.title !== body.title ||
      existing?.qualifications !== body.qualifications ||
      existing?.experienceYears !== body.experienceYears ||
      existing?.institutionId !== body.institutionId ||
      JSON.stringify([...(existing?.specialization ?? [])].sort()) !==
        JSON.stringify([...body.specialization].sort());

    const approvalStatus = !existing
      ? "PENDING"
      : existing.approvalStatus === "SUSPENDED"
        ? "SUSPENDED"
        : existing.approvalStatus === "APPROVED"
          ? keyFieldsChanged
            ? "PENDING"
            : "APPROVED"
          : "PENDING";

    const { error: lecturerError } = await supabase
      .from("Lecturer")
      .upsert(
        {
          id: existing?.id ?? crypto.randomUUID(),
          profileId: userId,
          title: body.title,
          specialization: body.specialization,
          qualifications: body.qualifications,
          experienceYears: body.experienceYears,
          bio: body.bio,
          linkedinUrl: body.linkedinUrl,
          institutionId: body.institutionId,
          isVisiting: body.isVisiting,
          hourlyRate: body.hourlyRate,
          approvalStatus,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "profileId" },
      );

    if (lecturerError) throw new Error(lecturerError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Lecturer profile setup failed:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
