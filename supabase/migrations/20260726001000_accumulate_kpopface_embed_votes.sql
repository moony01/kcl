-- A Kpopface visitor may cast up to 30 total votes per day in the embed.
-- Keep the member's overall KCL quota shared, while removing the accidental
-- one-submission-per-day lock that disabled the button after a one-vote tap.
CREATE OR REPLACE FUNCTION public.submit_kpopface_embed_vote(
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
  v_embed_used integer;
  v_daily_limit integer;
  v_vote_power integer;
  v_new_firepower bigint;
  v_remaining integer;
  v_embed_remaining integer;
BEGIN
  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_actor_id := auth.uid();
  v_vote_power := COALESCE(p_vote_power, 1);

  IF v_vote_power < 1 OR v_vote_power > 30 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Kpopface embed votes must be between 1 and 30', 'error_code', 'INVALID_VOTE_POWER');
  END IF;

  IF v_actor_id IS NOT NULL THEN
    SELECT COALESCE(o.daily_limit, 300)
    INTO v_daily_limit
    FROM (SELECT 1) seed
    LEFT JOIN public.kcl_vote_quota_overrides o ON o.user_id = v_actor_id;

    PERFORM pg_advisory_xact_lock(hashtext('kpopface_embed:' || v_actor_id::text || ':' || v_today_start::text));

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE user_id = v_actor_id AND created_at >= v_today_start;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_embed_used
    FROM public.kcl_votes
    WHERE user_id = v_actor_id AND vote_source = 'kpopface_embed' AND created_at >= v_today_start;
  ELSE
    v_daily_limit := 30;

    IF p_fingerprint IS NULL OR p_fingerprint = '' THEN
      RETURN jsonb_build_object('success', false, 'message', 'A browser identifier is required for guest voting', 'error_code', 'RATE_LIMITED', 'remaining', 0, 'embed_remaining', 0);
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('kpopface_embed:' || p_fingerprint || ':' || v_today_start::text));

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE ip_hash = p_fingerprint AND vote_source = 'kpopface_embed' AND created_at >= v_today_start;

    v_embed_used := v_actor_used;
  END IF;

  v_remaining := GREATEST(v_daily_limit - v_actor_used, 0);
  v_embed_remaining := GREATEST(30 - v_embed_used, 0);

  IF v_embed_used + v_vote_power > 30 THEN
    RETURN jsonb_build_object('success', false, 'message', 'The Kpopface embed allows up to 30 votes per day', 'error_code', 'EMBED_DAILY_LIMIT', 'remaining', LEAST(v_remaining, v_embed_remaining), 'embed_remaining', v_embed_remaining);
  END IF;

  IF v_actor_used + v_vote_power > v_daily_limit THEN
    RETURN jsonb_build_object('success', false, 'message', 'Daily vote limit exceeded', 'error_code', 'RATE_LIMITED', 'remaining', LEAST(v_remaining, v_embed_remaining), 'embed_remaining', v_embed_remaining);
  END IF;

  UPDATE public.kcl_companies
  SET firepower = COALESCE(firepower, 0) + v_vote_power,
      updated_at = now()
  WHERE id = p_company_id
  RETURNING firepower INTO v_new_firepower;

  IF v_new_firepower IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Company not found', 'error_code', 'INVALID_COMPANY');
  END IF;

  INSERT INTO public.kcl_votes (company_id, vote_power, ip_hash, vote_source, user_id)
  VALUES (p_company_id, v_vote_power, p_fingerprint, 'kpopface_embed', v_actor_id);

  IF v_actor_id IS NOT NULL THEN
    UPDATE public.kcl_user_profiles
    SET total_votes = COALESCE(total_votes, 0) + v_vote_power,
        updated_at = now()
    WHERE id = v_actor_id;
  END IF;

  v_remaining := GREATEST(v_daily_limit - (v_actor_used + v_vote_power), 0);
  v_embed_remaining := GREATEST(30 - (v_embed_used + v_vote_power), 0);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vote successful',
    'current_score', v_new_firepower,
    'vote_score', v_vote_power,
    'remaining', LEAST(v_remaining, v_embed_remaining),
    'embed_remaining', v_embed_remaining,
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
  v_embed_used integer;
  v_daily_limit integer;
  v_remaining integer;
  v_embed_remaining integer;
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
    WHERE user_id = v_actor_id AND created_at >= v_today_start;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_embed_used
    FROM public.kcl_votes
    WHERE user_id = v_actor_id AND vote_source = 'kpopface_embed' AND created_at >= v_today_start;
  ELSE
    v_daily_limit := 30;

    IF p_fingerprint IS NULL OR p_fingerprint = '' THEN
      RETURN jsonb_build_object('can_vote', false, 'has_used_embed', true, 'remaining', 0, 'daily_limit', v_daily_limit, 'max_vote_power', 0);
    END IF;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_actor_used
    FROM public.kcl_votes
    WHERE ip_hash = p_fingerprint AND vote_source = 'kpopface_embed' AND created_at >= v_today_start;

    v_embed_used := v_actor_used;
  END IF;

  v_remaining := GREATEST(v_daily_limit - v_actor_used, 0);
  v_embed_remaining := GREATEST(30 - v_embed_used, 0);

  RETURN jsonb_build_object(
    'can_vote', v_remaining > 0 AND v_embed_remaining > 0,
    'has_used_embed', v_embed_remaining = 0,
    'remaining', LEAST(v_remaining, v_embed_remaining),
    'daily_limit', v_daily_limit,
    'max_vote_power', LEAST(30, v_remaining, v_embed_remaining)
  );
END;
$function$;
