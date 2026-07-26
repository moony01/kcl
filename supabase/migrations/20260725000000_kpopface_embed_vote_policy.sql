-- Kpopface embed voting policy
-- - Guest: 30 ordinary votes/day per anonymous browser fingerprint
-- - Authenticated member: shared account quota (default 300/day)
-- - Embed accepts 1~30 votes per long press, once a day per actor
-- - The authenticated actor is always derived from auth.uid()

DROP FUNCTION IF EXISTS public.submit_kpopface_embed_vote(uuid, text);
DROP FUNCTION IF EXISTS public.submit_kpopface_embed_vote(uuid, text, integer);

CREATE FUNCTION public.submit_kpopface_embed_vote(
  p_company_id uuid,
  p_fingerprint text DEFAULT NULL::text,
  p_vote_power integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today_start timestamptz;
  v_actor_id uuid;
  v_actor_used integer;
  v_daily_limit integer;
  v_vote_power integer;
  v_has_used_embed boolean;
  v_new_firepower bigint;
BEGIN
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_actor_id := auth.uid();
  v_vote_power := COALESCE(p_vote_power, 1);

  IF v_vote_power < 1 OR v_vote_power > 30 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Kpopface embed votes must be between 1 and 30',
      'error_code', 'INVALID_VOTE_POWER'
    );
  END IF;

  IF v_actor_id IS NOT NULL THEN
    SELECT COALESCE(o.daily_limit, 300)
    INTO v_daily_limit
    FROM (SELECT 1) seed
    LEFT JOIN public.kcl_vote_quota_overrides o ON o.user_id = v_actor_id;

    PERFORM pg_advisory_xact_lock(hashtext(
      'kpopface_embed:' || v_actor_id::text || ':' || v_today_start::text
    ));

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE user_id = v_actor_id
      AND created_at >= v_today_start;
  ELSE
    v_daily_limit := 30;

    IF p_fingerprint IS NULL OR p_fingerprint = '' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'A browser identifier is required for guest voting',
        'error_code', 'RATE_LIMITED',
        'remaining', 0,
        'used', v_daily_limit,
        'daily_limit', v_daily_limit
      );
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext(
      'kpopface_embed:' || p_fingerprint || ':' || v_today_start::text
    ));

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE ip_hash = p_fingerprint
      AND vote_source = 'kpopface_embed'
      AND created_at >= v_today_start;
  END IF;

  IF v_actor_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.kcl_votes
      WHERE user_id = v_actor_id
        AND vote_source = 'kpopface_embed'
        AND created_at >= v_today_start
    )
    INTO v_has_used_embed;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.kcl_votes
      WHERE ip_hash = p_fingerprint
        AND vote_source = 'kpopface_embed'
        AND created_at >= v_today_start
    )
    INTO v_has_used_embed;
  END IF;

  IF v_has_used_embed THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Today''s Kpopface embed vote has already been used',
      'error_code', 'EMBED_DAILY_LIMIT',
      'remaining', GREATEST(v_daily_limit - v_actor_used, 0),
      'used', v_actor_used,
      'daily_limit', v_daily_limit
    );
  END IF;

  IF v_actor_used + v_vote_power > v_daily_limit THEN
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
  SET firepower = COALESCE(firepower, 0) + v_vote_power,
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

  INSERT INTO public.kcl_votes (
    company_id,
    vote_power,
    ip_hash,
    vote_source,
    user_id
  )
  VALUES (
    p_company_id,
    v_vote_power,
    p_fingerprint,
    'kpopface_embed',
    v_actor_id
  );

  IF v_actor_id IS NOT NULL THEN
    UPDATE public.kcl_user_profiles
    SET total_votes = COALESCE(total_votes, 0) + v_vote_power,
        updated_at = now()
    WHERE id = v_actor_id;
  END IF;

  v_actor_used := v_actor_used + v_vote_power;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vote successful',
    'current_score', v_new_firepower,
    'vote_score', v_vote_power,
    'remaining', GREATEST(v_daily_limit - v_actor_used, 0),
    'used', v_actor_used,
    'daily_limit', v_daily_limit
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_kpopface_embed_vote_status(
  p_fingerprint text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today_start timestamptz;
  v_actor_id uuid;
  v_actor_used integer;
  v_daily_limit integer;
  v_has_used_embed boolean;
  v_remaining integer;
BEGIN
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_actor_id := auth.uid();

  IF v_actor_id IS NOT NULL THEN
    SELECT COALESCE(o.daily_limit, 300)
    INTO v_daily_limit
    FROM (SELECT 1) seed
    LEFT JOIN public.kcl_vote_quota_overrides o ON o.user_id = v_actor_id;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE user_id = v_actor_id
      AND created_at >= v_today_start;

    SELECT EXISTS (
      SELECT 1 FROM public.kcl_votes
      WHERE user_id = v_actor_id
        AND vote_source = 'kpopface_embed'
        AND created_at >= v_today_start
    ) INTO v_has_used_embed;
  ELSE
    v_daily_limit := 30;

    IF p_fingerprint IS NULL OR p_fingerprint = '' THEN
      RETURN jsonb_build_object(
        'can_vote', false,
        'has_used_embed', true,
        'remaining', 0,
        'daily_limit', v_daily_limit,
        'max_vote_power', 0
      );
    END IF;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE ip_hash = p_fingerprint
      AND vote_source = 'kpopface_embed'
      AND created_at >= v_today_start;

    SELECT EXISTS (
      SELECT 1 FROM public.kcl_votes
      WHERE ip_hash = p_fingerprint
        AND vote_source = 'kpopface_embed'
        AND created_at >= v_today_start
    ) INTO v_has_used_embed;
  END IF;

  v_remaining := GREATEST(v_daily_limit - v_actor_used, 0);

  RETURN jsonb_build_object(
    'can_vote', NOT v_has_used_embed AND v_remaining > 0,
    'has_used_embed', v_has_used_embed,
    'remaining', v_remaining,
    'daily_limit', v_daily_limit,
    'max_vote_power', CASE
      WHEN v_has_used_embed THEN 0
      ELSE LEAST(30, v_remaining)
    END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_kpopface_embed_vote(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_kpopface_embed_vote_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_kpopface_embed_vote(uuid, text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpopface_embed_vote_status(text) TO anon, authenticated;
