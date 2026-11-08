-- INX-150: close the student self-write hole on Enrollment and
-- AssessmentSubmission. Idempotent; mirrors supabase/setup.sql.
-- Hand-written: not validated against the shadow DB.

DROP POLICY IF EXISTS "Students can insert own enrollment" ON "Enrollment";
DROP POLICY IF EXISTS "Students can insert own submissions" ON "AssessmentSubmission";

CREATE OR REPLACE FUNCTION public.guard_enrollment_student_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Enrollment rows can only be written by the server'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS guard_enrollment_student_writes ON "Enrollment";
CREATE TRIGGER guard_enrollment_student_writes
  BEFORE INSERT OR UPDATE ON "Enrollment"
  FOR EACH ROW EXECUTE FUNCTION public.guard_enrollment_student_writes();

CREATE OR REPLACE FUNCTION public.guard_assessment_submission_student_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'AssessmentSubmission rows can only be written by the server'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS guard_assessment_submission_student_writes ON "AssessmentSubmission";
CREATE TRIGGER guard_assessment_submission_student_writes
  BEFORE INSERT OR UPDATE ON "AssessmentSubmission"
  FOR EACH ROW EXECUTE FUNCTION public.guard_assessment_submission_student_writes();
