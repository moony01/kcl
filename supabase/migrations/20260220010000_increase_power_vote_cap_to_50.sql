-- ============================================
-- T2.03: 파워투표 서버 상한 10 -> 50 확장
-- ============================================
-- 목적:
-- - 클라이언트는 x50까지 충전하지만, RPC submit_vote_secure에서
--   LEAST(10, p_vote_power)로 잘려 실제 반영이 10표에 머무르는 문제 수정
--
-- 적용 결과:
-- - vote_power 범위를 1~50으로 허용
-- - 월간 한도/잔여 계산은 기존 로직 유지
-- ============================================

CREATE OR REPLACE FUNCTION public.submit_vote_secure(
  p_company_id uuid,
  p_group_id uuid DEFAULT NULL::uuid,
  p_fingerprint text DEFAULT NULL::text,
  p_daily_limit integer DEFAULT 30,
  p_user_id uuid DEFAULT NULL::uuid,
  p_vote_power integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
  v_vote_count INT;
  v_user_monthly_votes INT;
  v_new_firepower BIGINT;
  v_vote_score INT;
  v_monthly_limit INT;
  v_is_pro BOOLEAN;
BEGIN
  -- vote_power 범위 제한 (1~50)
  v_vote_score := GREATEST(1, LEAST(50, p_vote_power));

  v_today_start := date_trunc('day', now() AT TIME ZONE 'UTC');
  v_month_start := date_trunc('month', now() AT TIME ZONE 'UTC');

  IF p_user_id IS NOT NULL THEN
    SELECT COALESCE(is_pro, false)
    INTO v_is_pro
    FROM kcl_user_profiles
    WHERE id = p_user_id;

    v_monthly_limit := CASE WHEN v_is_pro THEN 300 ELSE 60 END;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_user_monthly_votes
    FROM kcl_votes
    WHERE user_id = p_user_id
      AND created_at >= v_month_start;

    IF v_user_monthly_votes + v_vote_score > v_monthly_limit THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Monthly vote limit exceeded',
        'error_code', 'RATE_LIMITED',
        'remaining', GREATEST(v_monthly_limit - v_user_monthly_votes, 0),
        'used', v_user_monthly_votes,
        'monthly_limit', v_monthly_limit,
        'is_pro', v_is_pro
      );
    END IF;
  ELSE
    IF p_fingerprint IS NOT NULL AND p_fingerprint != '' THEN
      SELECT COUNT(*)
      INTO v_vote_count
      FROM kcl_votes
      WHERE ip_hash = p_fingerprint
        AND created_at >= v_today_start;

      IF v_vote_count >= p_daily_limit THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Daily vote limit exceeded',
          'error_code', 'RATE_LIMITED',
          'remaining', 0,
          'used', v_vote_count
        );
      END IF;
    END IF;
  END IF;

  UPDATE kcl_companies
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

  INSERT INTO kcl_votes (company_id, group_id, vote_power, ip_hash, vote_source, user_id)
  VALUES (p_company_id, p_group_id, v_vote_score, p_fingerprint, 'web', p_user_id);

  IF p_user_id IS NOT NULL THEN
    UPDATE kcl_user_profiles
    SET total_votes = total_votes + v_vote_score,
        updated_at = now()
    WHERE id = p_user_id;

    SELECT COALESCE(SUM(vote_power), 0)
    INTO v_user_monthly_votes
    FROM kcl_votes
    WHERE user_id = p_user_id
      AND created_at >= v_month_start;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Vote successful',
      'current_score', v_new_firepower,
      'vote_score', v_vote_score,
      'remaining', GREATEST(v_monthly_limit - v_user_monthly_votes, 0),
      'used', v_user_monthly_votes,
      'monthly_limit', v_monthly_limit,
      'is_pro', v_is_pro
    );
  END IF;

  IF p_fingerprint IS NOT NULL AND p_fingerprint != '' THEN
    SELECT COUNT(*)
    INTO v_vote_count
    FROM kcl_votes
    WHERE ip_hash = p_fingerprint
      AND created_at >= v_today_start;
  ELSE
    v_vote_count := 0;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Vote successful',
    'current_score', v_new_firepower,
    'vote_score', v_vote_score,
    'remaining', GREATEST(p_daily_limit - v_vote_count, 0),
    'used', v_vote_count
  );
END;
$function$;
