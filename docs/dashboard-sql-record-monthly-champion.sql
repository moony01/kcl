-- ============================================================
-- record_monthly_champion RPC 버그 수정
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================
--
-- 버그: "아무 챔피언 존재 시 스킵" 패턴 → 3월 챔피언이 이미 있으면
--       4월에도 스킵해서 매월 새 챔피언이 기록되지 않음
--
-- 확인된 증거 (2026-04-30):
--   POST /rest/v1/rpc/record_monthly_champion → {"year":2026,"month":3,
--   "message":"Champion already recorded for this month","success":true}
--   4월인데 month=3을 "this month"로 판단하고 스킵함.
--
-- 수정: "이전 달 챔피언 존재 시 스킵" → "현재 달 챔피언 존재 시 스킵"으로 변경
--      + Advisory lock 추가 (동시 호출 직렬화)
--      + kcl_seasons(year, month) UNIQUE 제약 추가 (마지막 방어선)
--
-- 데이터 분석 기반 로직 추론:
--   - total_votes = 챔피언 회사의 firepower 값 (월말 스냅샷 시점)
--   - 챔피언 = 현재 firepower 최고 회사 (kcl_companies ORDER BY firepower DESC)
--   - kcl_season_rankings 스냅샷에서 rank=1 회사와 동일
--
-- [!] 주의: 이 함수의 원본 소스를 직접 확인하지 못하고 추론으로 작성함.
--     실행 전 반드시 아래 검증 쿼리를 먼저 실행해서 로직이 맞는지 확인할 것.
--
-- 실행 방법:
--   1. Supabase Dashboard 접속 → SQL Editor 클릭
--   2. 아래 SQL 전체 복사 + 붙여넣기
--   3. Run 클릭
-- ============================================================


-- ============================================================
-- [STEP 0] 실행 전 검증 쿼리 (먼저 실행해서 확인)
-- ============================================================
-- 현재 firepower 1위 회사 확인:
--   SELECT id, name_ko, firepower, league_tier
--   FROM kcl_companies
--   WHERE deleted_at IS NULL
--   ORDER BY firepower DESC
--   LIMIT 3;
--
-- kcl_seasons 현황 확인 (4월 레코드가 없어야 정상):
--   SELECT year, month, champion_company_id, total_votes
--   FROM kcl_seasons
--   ORDER BY year DESC, month DESC
--   LIMIT 5;
-- ============================================================


-- ============================================================
-- [STEP 1] UNIQUE 제약 추가 (kcl_seasons 중복 방어)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kcl_seasons_year_month_unique'
  ) THEN
    ALTER TABLE kcl_seasons
    ADD CONSTRAINT kcl_seasons_year_month_unique
    UNIQUE (year, month);
  END IF;
END $$;


-- ============================================================
-- [STEP 2] record_monthly_champion 함수 수정
-- ============================================================
-- [!] 원본 소스 미확인 — 아래 로직은 데이터 패턴 분석으로 추론:
--     · total_votes = 챔피언 회사의 firepower (kcl_seasons 기존 데이터와 일치)
--     · 챔피언 = firepower 최고 회사 (deleted_at IS NULL 조건)
--     · 파라미터 없음 (workflow 호출 패턴 확인)
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_monthly_champion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year              int;
  v_month             int;
  v_existing_count    int;
  v_champion_id       uuid;
  v_champion_fp       bigint;
BEGIN
  -- Acquire transaction-scoped advisory lock to serialize concurrent calls.
  PERFORM pg_advisory_xact_lock(hashtext('record_monthly_champion'));

  -- Target: current month (same fix as snapshot_season_rankings)
  -- Bug was: checking previous month, so April skipped because March record existed.
  v_year  := EXTRACT(YEAR  FROM DATE_TRUNC('month', NOW()))::int;
  v_month := EXTRACT(MONTH FROM DATE_TRUNC('month', NOW()))::int;

  -- Skip only if champion for THIS month is already recorded
  SELECT COUNT(*) INTO v_existing_count
  FROM kcl_seasons
  WHERE year = v_year AND month = v_month;

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object(
      'success',  true,
      'year',     v_year,
      'month',    v_month,
      'message',  'Champion already recorded for this month'
    );
  END IF;

  -- Determine champion: company with highest firepower (excluding deleted)
  -- [!] VERIFY: 원본 함수가 다른 기준(예: league_tier='premier' 필터)을
  --     사용한다면 아래 WHERE 절을 수정할 것.
  SELECT id, firepower
  INTO   v_champion_id, v_champion_fp
  FROM   kcl_companies
  WHERE  deleted_at IS NULL
  ORDER  BY firepower DESC
  LIMIT  1;

  IF v_champion_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'year',    v_year,
      'month',   v_month,
      'message', 'No companies found'
    );
  END IF;

  -- Record champion
  -- total_votes = champion company's firepower at snapshot time
  -- [!] VERIFY: 원본 함수가 SUM(vote_count) from kcl_groups 등 다른 소스를
  --     사용한다면 total_votes 값을 수정할 것.
  INSERT INTO kcl_seasons (year, month, champion_company_id, total_votes, decided_at)
  VALUES (v_year, v_month, v_champion_id, v_champion_fp, NOW());

  RETURN jsonb_build_object(
    'success',              true,
    'year',                 v_year,
    'month',                v_month,
    'message',              'Champion recorded',
    'champion_company_id',  v_champion_id,
    'total_votes',          v_champion_fp
  );
END;
$$;


-- ============================================================
-- [STEP 3] 실행 후 확인 쿼리
-- ============================================================
-- 함수 교체 확인:
--   SELECT prosrc FROM pg_proc WHERE proname = 'record_monthly_champion';
--
-- 테스트 실행 (실제 INSERT 발생하므로 주의):
--   SELECT record_monthly_champion();
--
-- 결과 확인:
--   SELECT year, month, champion_company_id, total_votes, decided_at
--   FROM kcl_seasons
--   ORDER BY year DESC, month DESC
--   LIMIT 3;
-- ============================================================
