import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";
import { db } from "~/server/db";

export type CurrentProfile = {
  id: string;
  role: Role;
  isActive: boolean;
};

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return db.profile.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, isActive: true },
  });
}

export async function requireAdmin(): Promise<{ id: string }> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  if (profile.role !== "ADMIN" || profile.isActive === false) {
    throw new Error("Forbidden");
  }
  return { id: profile.id };
}

export async function requireProfileRole(
  role: Role,
): Promise<{ profile: CurrentProfile } | { response: NextResponse }> {
  let profile: CurrentProfile | null;
  try {
    profile = await getCurrentProfile();
  } catch (err) {
    console.error("requireProfileRole failed:", err);
    return {
      response: NextResponse.json({ error: "Failed to save profile" }, { status: 500 }),
    };
  }
  if (!profile) {
    return {
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  if (profile.role !== role || profile.isActive === false) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { profile };
}
