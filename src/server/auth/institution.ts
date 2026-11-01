import { db } from "~/server/db";
import { getCurrentProfile } from "~/server/auth/admin";

export type InstitutionCaller = { profileId: string; institutionId: string };

/**
 * Resolves the signed-in institution account and the one institution it
 * owns. All institution server actions derive ids from this, never from
 * client input. ADMIN is deliberately not accepted (admins use the admin
 * actions).
 */
export async function requireInstitution(): Promise<InstitutionCaller> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  if (profile.role !== "INSTITUTION" || profile.isActive === false) {
    throw new Error("Forbidden");
  }

  const account = await db.institutionAccount.findUnique({
    where: { profileId: profile.id },
    select: { institutionId: true },
  });
  if (!account) throw new Error("Forbidden");

  return { profileId: profile.id, institutionId: account.institutionId };
}
