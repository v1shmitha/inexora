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

const employerSetupSchema = z.object({
  companyName: z.string().max(200),
  industry: nullableStr(100),
  companySize: nullableStr(50),
  website: nullableStr(500),
  description: nullableStr(5000),
  phone: nullableStr(40),
  city: nullableStr(100),
});

export async function POST(request: Request) {
  const auth = await requireProfileRole("EMPLOYER");
  if ("response" in auth) return auth.response;
  const userId = auth.profile.id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = employerSetupSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const body = parsed.data;

  try {
    const supabase = createAdminClient();

    // Update profile with contact info — do NOT set isVerified
    const { error: profileError } = await supabase
      .from("Profile")
      .update({
        phone: body.phone,
        city: body.city,
      })
      .eq("id", userId);

    if (profileError) throw new Error(profileError.message);

    // Re-submitting (editing an existing profile) must not silently reset an
    // approved employer's status — only the fields admins actually vet
    // (company identity, not website/description polish) trigger re-review.
    const { data: existingRaw } = await supabase
      .from("Employer")
      .select("id, approvalStatus, isVerified, companyName, industry, companySize")
      .eq("profileId", userId)
      .maybeSingle();

    const existing = existingRaw as {
      id: string;
      approvalStatus: string;
      isVerified: boolean;
      companyName: string;
      industry: string | null;
      companySize: string | null;
    } | null;

    const keyFieldsChanged =
      existing?.companyName !== body.companyName ||
      existing?.industry !== body.industry ||
      existing?.companySize !== body.companySize;

    const approvalStatus = !existing
      ? "PENDING"
      : existing.approvalStatus === "SUSPENDED"
        ? "SUSPENDED"
        : existing.approvalStatus === "APPROVED"
          ? keyFieldsChanged
            ? "PENDING"
            : "APPROVED"
          : "PENDING";

    const { error: employerError } = await supabase
      .from("Employer")
      .upsert(
        {
          id: existing?.id ?? crypto.randomUUID(),
          profileId: userId,
          companyName: body.companyName,
          industry: body.industry,
          companySize: body.companySize,
          website: body.website,
          description: body.description,
          isVerified: existing?.isVerified ?? false,
          approvalStatus,
        },
        { onConflict: "profileId" },
      );

    if (employerError) throw new Error(employerError.message);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Employer profile setup failed:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
