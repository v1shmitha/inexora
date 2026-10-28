/**
 * Test helpers for building fake tRPC contexts.
 *
 * Usage in a router test:
 *   vi.mock("~/server/db", () => ({ db: {} }));
 *   vi.mock("~/lib/supabase/server", () => ({ createClient: vi.fn() }));
 *   const caller = createCaller(makeCtx({ profile: makeProfile({ role: "STUDENT" }) }));
 *
 * Pass `db` to makeCtx with just the Prisma methods the procedure uses,
 * e.g. makeCtx({ profile, db: { jobListing: { findMany: vi.fn().mockResolvedValue([]) } } }).
 */
import type { Context } from "~/server/api/trpc";

type Profile = NonNullable<Context["profile"]>;
type Lecturer = NonNullable<Profile["lecturer"]>;
type Employer = NonNullable<Profile["employer"]>;
type ManagerEntry = Lecturer["managedInstitutions"][number];

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    email: "user@test.local",
    role: "STUDENT",
    isActive: true,
    is_admin: false,
    lecturer: null,
    employer: null,
    ...overrides,
  } as Profile;
}

export function makeLecturer(overrides: Partial<Lecturer> = {}): Lecturer {
  return {
    id: "lecturer-1",
    profileId: "user-1",
    approvalStatus: "APPROVED",
    managedInstitutions: [],
    ...overrides,
  } as Lecturer;
}

export function makeManagerEntry(
  overrides: Partial<ManagerEntry> = {},
): ManagerEntry {
  return {
    id: "manager-1",
    institutionId: "institution-1",
    lecturerId: "lecturer-1",
    canManagePrograms: true,
    ...overrides,
  } as ManagerEntry;
}

export function makeEmployer(overrides: Partial<Employer> = {}): Employer {
  return {
    id: "employer-1",
    profileId: "user-1",
    companyName: "Test Co",
    approvalStatus: "APPROVED",
    ...overrides,
  } as Employer;
}

/**
 * Build a tRPC context. `profile: null` = logged out.
 * By default a Supabase user exists whenever a profile is given.
 */
export function makeCtx(
  opts: {
    profile?: Profile | null;
    hasUser?: boolean;
    db?: unknown;
  } = {},
): Context {
  const profile = opts.profile ?? null;
  const hasUser = opts.hasUser ?? profile !== null;
  return {
    db: (opts.db ?? {}) as Context["db"],
    user: hasUser
      ? ({ id: profile?.id ?? "user-1" } as NonNullable<Context["user"]>)
      : null,
    profile,
    req: {} as Context["req"],
  };
}
