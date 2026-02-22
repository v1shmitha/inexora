import { createClient } from "~/lib/supabase/server";
import { NextResponse } from "next/server";
import { db } from "~/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create profile in DB if first time
      await db.profile.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email: data.user.email!,
          fullName: data.user.user_metadata?.full_name,
          avatarUrl: data.user.user_metadata?.avatar_url,
        },
      });

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}