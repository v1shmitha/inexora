import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "~/lib/supabase/admin";
import { createClient } from "~/lib/supabase/server";

const FRESH_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

// Profile.createdAt is TIMESTAMP(3) without time zone, so PostgREST returns it
// with no "Z"/offset. new Date() would read that as server-local time and make
// a fresh account look hours old on a non-UTC server. The value is UTC.
function parseUtcTimestamp(value: string): number {
  // Only the time part can carry an offset; the date part contains "-".
  const hasZone = /(Z|[+-]\d{2}(:?\d{2})?)$/i.test(value.slice(10));
  return new Date(hasZone ? value : `${value}Z`).getTime();
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/redirect";
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If a role was passed (OAuth signup flow), update both metadata and
      // the Profile record directly — the trigger fires on INSERT before
      // updateUser runs, so we patch Profile here to guarantee the correct role.
      if (role && ["STUDENT", "LECTURER", "EMPLOYER"].includes(role)) {
        // Profile.role is locked against user-session writes by a DB trigger,
        // so this write goes through the admin client. Because the role comes
        // from a query-string param, only apply it to a brand-new account
        // (still STUDENT, no role row yet, created in the last 10 minutes);
        // otherwise a returning user could re-run this URL to switch roles.
        const admin = createAdminClient();
        const userId = data.user.id;
        const { data: existing, error: profileLookupError } = await admin
          .from("Profile")
          .select("role, createdAt")
          .eq("id", userId)
          .maybeSingle();

        const roleRowChecks = await Promise.all(
          ["Student", "Lecturer", "Employer"].map((table) =>
            admin
              .from(table)
              .select("id", { count: "exact", head: true })
              .eq("profileId", userId),
          ),
        );

        if (profileLookupError || roleRowChecks.some((r) => r.error)) {
          // Fail closed: without a reliable freshness check, don't write a role.
          console.error("OAuth role assignment skipped: account lookup failed");
        } else {
          const hasRoleRow = roleRowChecks.some((r) => (r.count ?? 0) > 0);
          const isFresh =
            !!existing &&
            existing.role === "STUDENT" &&
            !hasRoleRow &&
            Date.now() - parseUtcTimestamp(existing.createdAt as string) <
              FRESH_ACCOUNT_WINDOW_MS;

          if (isFresh) {
            await supabase.auth.updateUser({ data: { role } });
            // isActive means "not suspended by an admin" — always true at signup.
            // Lecturer/employer moderation is gated by their approvalStatus
            // instead; setting isActive false here made the middleware treat
            // brand-new accounts as suspended and lock them out of profile-setup.
            await admin
              .from("Profile")
              .update({
                role: role as "STUDENT" | "LECTURER" | "EMPLOYER",
                isActive: true,
                updatedAt: new Date().toISOString(),
              })
              .eq("id", userId);
          }
        }
      }

      // OAuth providers only give us name + email, so consent was never
      // captured — gate on it once before letting the user continue,
      // regardless of which step they were originally headed to.
      const { data: profile } = await supabase
        .from("Profile")
        .select("termsAcceptedAt")
        .eq("id", data.user.id)
        .single();

      if (!profile?.termsAcceptedAt) {
        return NextResponse.redirect(
          `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("OAuth code exchange failed:", error?.message);
  }

  return NextResponse.redirect(
    `${origin}/login?message=Could not authenticate. Please try again.`
  );
}