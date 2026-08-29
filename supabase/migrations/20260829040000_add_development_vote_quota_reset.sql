-- Development-only helper for the deterministic local test account.
--
-- The browser test session has no Supabase JWT, so the reset button cannot use
-- auth.uid(). The function is intentionally hard-coded to the fixture user and
-- only removes that user's votes from the current UTC day.

BEGIN;

CREATE OR REPLACE FUNCTION public.reset_development_test_vote_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_development_user_id CONSTANT uuid := 'c1192de6-89bd-45f7-9d91-e0eec631a589';
  v_today_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_deleted_votes integer := 0;
  v_deleted_score integer := 0;
  v_company record;
BEGIN
  -- Prevent two reset clicks from decrementing company scores twice.
  PERFORM pg_advisory_xact_lock(
    hashtext('mearrow:development-vote-reset:' || v_development_user_id::text)
  );

  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(vote_power), 0)::integer
  INTO v_deleted_votes, v_deleted_score
  FROM public.votes
  WHERE user_id = v_development_user_id
    AND created_at >= v_today_start;

  IF v_deleted_votes > 0 THEN
    FOR v_company IN
      SELECT company_id, COALESCE(SUM(vote_power), 0)::bigint AS deleted_score
      FROM public.votes
      WHERE user_id = v_development_user_id
        AND created_at >= v_today_start
      GROUP BY company_id
    LOOP
      UPDATE public.companies
      SET firepower = GREATEST(COALESCE(firepower, 0) - v_company.deleted_score, 0),
          updated_at = now()
      WHERE id = v_company.company_id;
    END LOOP;

    DELETE FROM public.votes
    WHERE user_id = v_development_user_id
      AND created_at >= v_today_start;

    UPDATE public.user_profiles
    SET total_votes = GREATEST(COALESCE(total_votes, 0) - v_deleted_score, 0),
        updated_at = now()
    WHERE id = v_development_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'deleted_votes', v_deleted_votes,
    'deleted_score', v_deleted_score
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_development_test_vote_quota() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_development_test_vote_quota() TO anon, authenticated;

COMMENT ON FUNCTION public.reset_development_test_vote_quota() IS
  'Development-only reset for the fixed MEARROW local test user current-day vote quota.';

COMMIT;
