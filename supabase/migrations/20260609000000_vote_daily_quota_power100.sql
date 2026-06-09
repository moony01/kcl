-- ============================================
-- 2026-06: Daily vote quota + power vote x100
-- ============================================
-- Policy:
-- - Guest: 100 votes/day
-- - Signed-in member: 300 votes/day
-- - Owner/operator override: 500 votes/day via kcl_vote_quota_overrides
-- - Power vote: max x100, counted by SUM(vote_power)
--
-- Legacy Pro/BMC tables and profile columns remain intact.
-- ============================================

CREATE TABLE IF NOT EXISTS public.kcl_vote_quota_overrides (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_limit integer NOT NULL CHECK (daily_limit > 0),
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kcl_vote_quota_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kcl_vote_quota_overrides_service_role_all" ON public.kcl_vote_quota_overrides;
CREATE POLICY "kcl_vote_quota_overrides_service_role_all" ON public.kcl_vote_quota_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.submit_vote_secure(
  p_company_id uuid,
  p_group_id uuid DEFAULT NULL::uuid,
  p_fingerprint text DEFAULT NULL::text,
  p_daily_limit integer DEFAULT 100,
  p_user_id uuid DEFAULT NULL::uuid,
  p_vote_power integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today_start timestamptz;
  v_actor_used integer;
  v_new_firepower bigint;
  v_vote_score integer;
  v_daily_limit integer;
BEGIN
  v_vote_score := GREATEST(1, LEAST(100, COALESCE(p_vote_power, 1)));
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(o.daily_limit, 300)
    INTO v_daily_limit
    FROM (SELECT 1) seed
    LEFT JOIN public.kcl_vote_quota_overrides o ON o.user_id = p_user_id;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE user_id = p_user_id
      AND created_at >= v_today_start;
  ELSE
    v_daily_limit := LEAST(GREATEST(COALESCE(p_daily_limit, 100), 1), 100);

    IF p_fingerprint IS NOT NULL AND p_fingerprint <> '' THEN
      SELECT COALESCE(SUM(vote_power), 0)
      INTO v_actor_used
      FROM public.kcl_votes
      WHERE ip_hash = p_fingerprint
        AND created_at >= v_today_start;
    ELSE
      v_actor_used := 0;
    END IF;
  END IF;

  IF v_actor_used + v_vote_score > v_daily_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily vote limit exceeded',
      'error_code', 'RATE_LIMITED',
      'remaining', GREATEST(v_daily_limit - v_actor_used, 0),
      'used', v_actor_used,
      'daily_limit', v_daily_limit
    );
  END IF;

  UPDATE public.kcl_companies
  SET firepower = COALESCE(firepower, 0) + v_vote_score,
      updated_at = now()
  WHERE id = p_company_id
  RETURNING firepower INTO v_new_firepower;

  IF v_new_firepower IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Company not found',
      'error_code', 'INVALID_COMPANY'
    );
  END IF;

  INSERT INTO public.kcl_votes (company_id, group_id, vote_power, ip_hash, vote_source, user_id)
  VALUES (p_company_id, p_group_id, v_vote_score, p_fingerprint, 'web', p_user_id);

  IF p_user_id IS NOT NULL THEN
    UPDATE public.kcl_user_profiles
    SET total_votes = COALESCE(total_votes, 0) + v_vote_score,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  v_actor_used := v_actor_used + v_vote_score;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vote successful',
    'current_score', v_new_firepower,
    'vote_score', v_vote_score,
    'remaining', GREATEST(v_daily_limit - v_actor_used, 0),
    'used', v_actor_used,
    'daily_limit', v_daily_limit
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_vote_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today_start timestamptz;
  v_daily_used integer;
  v_daily_limit integer;
  v_total_votes integer;
  v_top_companies jsonb;
BEGIN
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';

  SELECT COALESCE(o.daily_limit, 300)
  INTO v_daily_limit
  FROM (SELECT 1) seed
  LEFT JOIN public.kcl_vote_quota_overrides o ON o.user_id = p_user_id;

  SELECT COALESCE(SUM(vote_power), 0)
  INTO v_daily_used
  FROM public.kcl_votes
  WHERE user_id = p_user_id
    AND created_at >= v_today_start;

  SELECT COALESCE(SUM(vote_power), 0)
  INTO v_total_votes
  FROM public.kcl_votes
  WHERE user_id = p_user_id;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'company_id', ranked.company_id,
        'company_name', ranked.name_en,
        'name_en', ranked.name_en,
        'name_ko', ranked.name_ko,
        'vote_count', ranked.vote_count,
        'votes', ranked.vote_count,
        'gradient_color', ranked.gradient_color
      )
      ORDER BY ranked.vote_count DESC
    ),
    '[]'::jsonb
  )
  INTO v_top_companies
  FROM (
    SELECT
      v.company_id,
      c.name_en,
      c.name_ko,
      c.gradient_color,
      COALESCE(SUM(v.vote_power), 0) AS vote_count
    FROM public.kcl_votes v
    JOIN public.kcl_companies c ON c.id = v.company_id
    WHERE v.user_id = p_user_id
    GROUP BY v.company_id, c.name_en, c.name_ko, c.gradient_color
    ORDER BY vote_count DESC
    LIMIT 5
  ) ranked;

  RETURN jsonb_build_object(
    'daily_used', v_daily_used,
    'daily_remaining', GREATEST(v_daily_limit - v_daily_used, 0),
    'daily_limit', v_daily_limit,
    'total_votes', v_total_votes,
    'top_companies', v_top_companies
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.submit_vote_secure(uuid, uuid, text, integer, uuid, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_vote_stats(uuid) TO authenticated;
