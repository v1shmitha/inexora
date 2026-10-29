-- INX-124: stop users granting themselves a role, admin rights or moderation
-- approval via the Supabase API. Idempotent; mirrors supabase/setup.sql.
-- Hand-written: references auth.users, so not validated against the shadow DB.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  -- Read role from signup metadata. raw_user_meta_data is client-controlled
  -- (anyone can pass it to supabase.auth.signUp), so only the self-service
  -- roles are honoured; anything else (ADMIN, INSTITUTION, junk) becomes
  -- STUDENT. Institution accounts are created by the createInstitutionAccount
  -- server action, which writes the role itself with the service role.
  user_role := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''), 'STUDENT');

  IF user_role NOT IN ('STUDENT', 'LECTURER', 'EMPLOYER') THEN
    user_role := 'STUDENT';
  END IF;

  INSERT INTO public."Profile" (
    id, email, "fullName", role,
    "isVerified", "isActive", is_admin,
    "createdAt", "updatedAt"
  )
  VALUES (
    NEW.id::text,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role::public."Role",
    false,
    -- isActive means "not suspended by an admin" and must start true for
    -- every role. Lecturer/employer/institution moderation is gated by
    -- their own approvalStatus columns, NOT by isActive — starting it
    -- false makes the middleware treat new signups as suspended and lock
    -- them out before they can even complete profile setup.
    true,
    -- Never grant admin from signup metadata.
    false,
    NOW(), NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2b. PRIVILEGED COLUMN GUARDS
-- RLS policies are row-level only, so a user allowed to UPDATE their own row
-- could also set role / is_admin / approvalStatus on it via the Supabase API.
-- Column REVOKEs don't work here (section 1 re-grants ALL on every run), so
-- BEFORE triggers reject changes to moderation/privilege columns when the
-- caller is the `authenticated` or `anon` role. service_role (admin client),
-- postgres (Prisma) and SECURITY DEFINER code (handle_new_user) are not
-- affected. On INSERT only the column default is accepted.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW."isActive" IS DISTINCT FROM OLD."isActive"
     OR NEW."isVerified" IS DISTINCT FROM OLD."isVerified" THEN
    RAISE EXCEPTION 'Not allowed to change privileged columns on %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON "Profile";
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON "Profile"
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_lecturer_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW."approvalStatus" IS DISTINCT FROM 'PENDING' THEN
      RAISE EXCEPTION 'Not allowed to set privileged columns on %', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."approvalStatus" IS DISTINCT FROM OLD."approvalStatus" THEN
    RAISE EXCEPTION 'Not allowed to change privileged columns on %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_lecturer_privileged_columns ON "Lecturer";
CREATE TRIGGER guard_lecturer_privileged_columns
  BEFORE INSERT OR UPDATE ON "Lecturer"
  FOR EACH ROW EXECUTE FUNCTION public.guard_lecturer_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_employer_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW."approvalStatus" IS DISTINCT FROM 'PENDING'
       OR NEW."isVerified" IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Not allowed to set privileged columns on %', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."approvalStatus" IS DISTINCT FROM OLD."approvalStatus"
     OR NEW."isVerified" IS DISTINCT FROM OLD."isVerified" THEN
    RAISE EXCEPTION 'Not allowed to change privileged columns on %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_employer_privileged_columns ON "Employer";
CREATE TRIGGER guard_employer_privileged_columns
  BEFORE INSERT OR UPDATE ON "Employer"
  FOR EACH ROW EXECUTE FUNCTION public.guard_employer_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_institution_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW."approvalStatus" IS DISTINCT FROM 'PENDING'
       OR NEW."isVerified" IS DISTINCT FROM false
       OR NEW."isActive" IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Not allowed to set privileged columns on %', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."approvalStatus" IS DISTINCT FROM OLD."approvalStatus"
     OR NEW."isVerified" IS DISTINCT FROM OLD."isVerified"
     OR NEW."isActive" IS DISTINCT FROM OLD."isActive" THEN
    RAISE EXCEPTION 'Not allowed to change privileged columns on %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_institution_privileged_columns ON "Institution";
CREATE TRIGGER guard_institution_privileged_columns
  BEFORE INSERT OR UPDATE ON "Institution"
  FOR EACH ROW EXECUTE FUNCTION public.guard_institution_privileged_columns();

CREATE OR REPLACE FUNCTION public.guard_program_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW."approvalStatus" IS DISTINCT FROM 'DRAFT'
       OR NEW."reviewedById" IS DISTINCT FROM NULL
       OR NEW."reviewNote" IS DISTINCT FROM NULL
       OR NEW."reviewedAt" IS DISTINCT FROM NULL THEN
      RAISE EXCEPTION 'Not allowed to set privileged columns on %', TG_TABLE_NAME
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."approvalStatus" IS DISTINCT FROM OLD."approvalStatus"
     OR NEW."reviewedById" IS DISTINCT FROM OLD."reviewedById"
     OR NEW."reviewNote" IS DISTINCT FROM OLD."reviewNote"
     OR NEW."reviewedAt" IS DISTINCT FROM OLD."reviewedAt" THEN
    RAISE EXCEPTION 'Not allowed to change privileged columns on %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_program_privileged_columns ON "Program";
CREATE TRIGGER guard_program_privileged_columns
  BEFORE INSERT OR UPDATE ON "Program"
  FOR EACH ROW EXECUTE FUNCTION public.guard_program_privileged_columns();


-- Removed (INX-124): this let any authenticated user link themselves to any
-- institution. InstitutionAccount rows are created only by the
-- createInstitutionAccount admin action, using the service role.
DROP POLICY IF EXISTS "Users can insert own institution account" ON "InstitutionAccount";
