-- ============================================
-- T1.53: league_tier 컬럼 추가 마이그레이션
-- ============================================
-- 목적: 2부리그 투표 시 1부리그로 즉시 진입하는 문제 수정
-- 
-- 현재 로직: firepower 상위 10개 → 1부, 나머지 → 2부 (동적 계산)
-- 변경 로직: 시즌 시작 시 리그 배정 → 시즌 중 고정 → 월초에만 승강
--
-- 적용 방법:
-- 1. Supabase Dashboard > SQL Editor에서 실행
-- 2. 또는 Supabase CLI: supabase db push
-- ============================================

-- 1. league_tier 컬럼 추가
-- 값: 'premier' (1부) | 'challengers' (2부)
-- 기본값: 'challengers' (신규 소속사는 2부에서 시작)
ALTER TABLE kcl_companies 
ADD COLUMN IF NOT EXISTS league_tier text DEFAULT 'challengers';

-- 2. 컬럼 값 제약조건 추가 (유효한 값만 허용)
ALTER TABLE kcl_companies 
ADD CONSTRAINT kcl_companies_league_tier_check 
CHECK (league_tier IN ('premier', 'challengers'));

-- 3. 현재 firepower 상위 10개를 1부(premier)로 설정
-- 기존 데이터 마이그레이션
UPDATE kcl_companies 
SET league_tier = 'premier' 
WHERE id IN (
  SELECT id FROM kcl_companies 
  ORDER BY firepower DESC, id ASC 
  LIMIT 10
);

-- 4. 인덱스 추가 (리그별 조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_kcl_companies_league_tier 
ON kcl_companies(league_tier);

-- 5. 복합 인덱스 (리그별 순위 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_kcl_companies_league_firepower 
ON kcl_companies(league_tier, firepower DESC, id ASC);

-- ============================================
-- 검증 쿼리 (마이그레이션 후 확인용)
-- ============================================
-- 1부 리그 확인 (10개여야 함)
-- SELECT id, name_ko, firepower, league_tier 
-- FROM kcl_companies 
-- WHERE league_tier = 'premier' 
-- ORDER BY firepower DESC;

-- 2부 리그 확인
-- SELECT id, name_ko, firepower, league_tier 
-- FROM kcl_companies 
-- WHERE league_tier = 'challengers' 
-- ORDER BY firepower DESC;

-- ============================================
-- 롤백 스크립트 (필요시)
-- ============================================
-- DROP INDEX IF EXISTS idx_kcl_companies_league_firepower;
-- DROP INDEX IF EXISTS idx_kcl_companies_league_tier;
-- ALTER TABLE kcl_companies DROP CONSTRAINT IF EXISTS kcl_companies_league_tier_check;
-- ALTER TABLE kcl_companies DROP COLUMN IF EXISTS league_tier;
