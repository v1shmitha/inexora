import type { Role } from "@prisma/client";
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
