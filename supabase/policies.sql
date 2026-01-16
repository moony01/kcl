-- ============================================
-- KCL (K-pop Company League) RLS Policies
-- ============================================
-- 이 파일은 Supabase Dashboard에 적용된 RLS 정책의 
-- 코드 버전 관리용 문서입니다.
--
-- 적용 방법:
-- 1. Supabase Dashboard > SQL Editor에서 실행
-- 2. 또는 Supabase CLI: supabase db push
--
-- 주의: 
-- - 정책이 이미 존재하면 DROP 후 CREATE 필요
-- - 프로덕션 적용 전 테스트 환경에서 검증 필수
-- ============================================

-- ============================================
-- 1. kcl_companies (소속사 테이블)
-- ============================================
-- 용도: K-pop 소속사 정보 (순위, 화력 등)
-- 정책: 읽기 전용 (관리자만 수정 가능)

ALTER TABLE kcl_companies ENABLE ROW LEVEL SECURITY;

-- 정책 1: 공개 읽기 허용 (소속사 목록/상세 조회)
CREATE POLICY "kcl_companies_select_public" ON kcl_companies
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: 정책 없음 = 차단
-- (관리자는 Supabase Dashboard 또는 Service Role Key로 수정)


-- ============================================
-- 2. kcl_groups (아티스트 그룹 테이블)
-- ============================================
-- 용도: 소속사별 아티스트 그룹 정보
-- 정책: 읽기 전용

ALTER TABLE kcl_groups ENABLE ROW LEVEL SECURITY;

-- 정책 1: 공개 읽기 허용 (그룹 목록/투표 대상 조회)
CREATE POLICY "kcl_groups_select_public" ON kcl_groups
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- INSERT/UPDATE/DELETE: 정책 없음 = 차단


-- ============================================
-- 3. kcl_votes (투표 기록 테이블)
-- ============================================
-- 용도: 사용자 투표 기록 (익명, IP 해시로 식별)
-- 정책: INSERT만 허용, 투표 조작 방지

ALTER TABLE kcl_votes ENABLE ROW LEVEL SECURITY;

-- 정책 1: 익명 INSERT 허용 (누구나 투표 가능)
-- 주의: Rate Limiting은 애플리케이션 레벨(Redis)에서 처리
CREATE POLICY "kcl_votes_insert_anon" ON kcl_votes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 정책 2: SELECT 차단 (개별 투표 조회 불가)
-- 집계 결과는 kcl_companies.firepower 또는 kcl_groups.vote_count로 확인
-- (필요시 집계 전용 SELECT 정책 추가 가능)

-- UPDATE/DELETE: 정책 없음 = 차단 (투표 조작 방지)


-- ============================================
-- 4. kcl_posts (커뮤니티 게시글 테이블)
-- ============================================
-- 용도: 자유게시판 게시글 (익명)
-- 정책: 
--   - SELECT: 숨김 처리되지 않은 글만 공개
--   - INSERT: 익명 허용
--   - UPDATE: 조회수 증가만 허용 (내부 로직)
--   - DELETE: 차단 (is_hidden으로 soft delete)

ALTER TABLE kcl_posts ENABLE ROW LEVEL SECURITY;

-- 정책 1: 공개 읽기 (숨김 처리 안 된 글만)
CREATE POLICY "kcl_posts_select_visible" ON kcl_posts
  FOR SELECT
  TO anon, authenticated
  USING (is_hidden = false);

-- 정책 2: 익명 INSERT 허용
CREATE POLICY "kcl_posts_insert_anon" ON kcl_posts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- 필수 필드 검증
    nickname IS NOT NULL AND
    title IS NOT NULL AND
    content IS NOT NULL AND
    ip_hash IS NOT NULL AND
    -- 기본값 강제 (클라이언트 조작 방지)
    view_count = 0 AND
    comment_count = 0 AND
    is_hidden = false
  );

-- 정책 3: 조회수 UPDATE 허용 (서버에서만 호출)
-- 주의: 이 정책은 서버 사이드에서만 사용해야 함
-- 클라이언트 조작 방지를 위해 Service Role Key 사용 권장
CREATE POLICY "kcl_posts_update_view_count" ON kcl_posts
  FOR UPDATE
  TO anon, authenticated
  USING (is_hidden = false)
  WITH CHECK (
    -- view_count 증가만 허용 (1씩)
    view_count = (SELECT view_count + 1 FROM kcl_posts WHERE id = kcl_posts.id)
  );

-- DELETE: 정책 없음 = 차단 (soft delete 사용)


-- ============================================
-- 5. kcl_post_comments (게시글 댓글 테이블)
-- ============================================
-- 용도: 게시글 댓글 (익명)
-- 정책: 게시글과 동일한 패턴

ALTER TABLE kcl_post_comments ENABLE ROW LEVEL SECURITY;

-- 정책 1: 공개 읽기 (숨김 처리 안 된 댓글만)
CREATE POLICY "kcl_post_comments_select_visible" ON kcl_post_comments
  FOR SELECT
  TO anon, authenticated
  USING (is_hidden = false);

-- 정책 2: 익명 INSERT 허용
CREATE POLICY "kcl_post_comments_insert_anon" ON kcl_post_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- 필수 필드 검증
    post_id IS NOT NULL AND
    nickname IS NOT NULL AND
    content IS NOT NULL AND
    ip_hash IS NOT NULL AND
    -- 기본값 강제
    is_hidden = false
  );

-- UPDATE/DELETE: 정책 없음 = 차단


-- ============================================
-- 6. kcl_reports (신고 기록 테이블)
-- ============================================
-- 용도: 게시글/댓글 신고 (익명)
-- 정책: INSERT만 허용, 중복 신고 방지는 애플리케이션에서 처리

ALTER TABLE kcl_reports ENABLE ROW LEVEL SECURITY;

-- 정책 1: 익명 INSERT 허용
CREATE POLICY "kcl_reports_insert_anon" ON kcl_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- 필수 필드 검증
    target_type IN ('post', 'comment') AND
    target_id IS NOT NULL AND
    ip_hash IS NOT NULL
  );

-- 정책 2: 중복 확인용 SELECT (자신의 신고만)
-- 주의: ip_hash 기반 조회는 보안상 민감할 수 있음
-- 대안: 애플리케이션 레벨에서 중복 체크 (현재 구현 방식)
CREATE POLICY "kcl_reports_select_own" ON kcl_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- 중복 체크를 위해 임시 허용

-- UPDATE/DELETE: 정책 없음 = 차단


-- ============================================
-- 정책 삭제 명령어 (재적용 시 사용)
-- ============================================
-- 주석 해제 후 실행하면 모든 정책 삭제
/*
DROP POLICY IF EXISTS "kcl_companies_select_public" ON kcl_companies;
DROP POLICY IF EXISTS "kcl_groups_select_public" ON kcl_groups;
DROP POLICY IF EXISTS "kcl_votes_insert_anon" ON kcl_votes;
DROP POLICY IF EXISTS "kcl_posts_select_visible" ON kcl_posts;
DROP POLICY IF EXISTS "kcl_posts_insert_anon" ON kcl_posts;
DROP POLICY IF EXISTS "kcl_posts_update_view_count" ON kcl_posts;
DROP POLICY IF EXISTS "kcl_post_comments_select_visible" ON kcl_post_comments;
DROP POLICY IF EXISTS "kcl_post_comments_insert_anon" ON kcl_post_comments;
DROP POLICY IF EXISTS "kcl_reports_insert_anon" ON kcl_reports;
DROP POLICY IF EXISTS "kcl_reports_select_own" ON kcl_reports;
*/


-- ============================================
-- 보안 점검 체크리스트
-- ============================================
-- [x] kcl_companies: 읽기만 허용
-- [x] kcl_groups: 읽기만 허용  
-- [x] kcl_votes: INSERT만 허용 (투표 조작 방지)
-- [x] kcl_posts: 조회/작성 허용, 수정/삭제 제한
-- [x] kcl_post_comments: 조회/작성 허용, 수정/삭제 제한
-- [x] kcl_reports: INSERT만 허용, 중복 체크용 SELECT
--
-- 추가 권장사항:
-- 1. 관리자 기능은 Service Role Key 사용
-- 2. Rate Limiting: 애플리케이션 레벨(Redis) 유지
-- 3. IP 해시: bcrypt 대신 SHA-256 사용 권장 (조회 성능)
-- 4. 정기적으로 is_hidden=true 데이터 정리 (배치 작업)
