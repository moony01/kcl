# KCL Supabase Database Documentation

이 디렉토리는 KCL (K-pop Company League) 프로젝트의 Supabase 데이터베이스 설정을 코드로 관리합니다.

## 파일 구조

```
packages/kcl/supabase/
├── README.md          # 이 문서
└── policies.sql       # RLS (Row Level Security) 정책
```

## 테이블 스키마 개요

### 1. kcl_companies (소속사)

| 컬럼           | 타입        | 설명            |
| -------------- | ----------- | --------------- |
| id             | uuid        | PK              |
| name_ko        | text        | 한글명          |
| name_en        | text        | 영문명          |
| slug           | text        | URL용 식별자    |
| logo_url       | text        | 로고 이미지 URL |
| gradient_color | text        | 브랜드 컬러     |
| rank           | integer     | 현재 순위       |
| firepower      | bigint      | 누적 투표 점수  |
| created_at     | timestamptz | 생성일          |

**RLS 정책**: SELECT만 허용 (공개 읽기)

### 2. kcl_groups (아티스트 그룹)

| 컬럼         | 타입    | 설명                |
| ------------ | ------- | ------------------- |
| id           | uuid    | PK                  |
| company_id   | uuid    | FK -> kcl_companies |
| name_ko      | text    | 한글명              |
| name_en      | text    | 영문명              |
| slug         | text    | URL용 식별자        |
| debut_date   | date    | 데뷔일              |
| member_count | integer | 멤버 수             |
| group_type   | text    | boy/girl/solo/co-ed |
| is_active    | boolean | 활동 중 여부        |
| vote_count   | bigint  | 그룹 투표 수        |

**RLS 정책**: SELECT만 허용 (공개 읽기)

### 3. kcl_votes (투표 기록)

| 컬럼       | 타입        | 설명                        |
| ---------- | ----------- | --------------------------- |
| id         | uuid        | PK                          |
| company_id | uuid        | FK -> kcl_companies         |
| group_id   | uuid        | FK -> kcl_groups (nullable) |
| ip_hash    | text        | 투표자 IP 해시              |
| score      | integer     | 투표 점수 (기본 1)          |
| created_at | timestamptz | 투표 시각                   |

**RLS 정책**: INSERT만 허용 (투표 조작 방지)

### 4. kcl_posts (커뮤니티 게시글)

| 컬럼          | 타입        | 설명           |
| ------------- | ----------- | -------------- |
| id            | uuid        | PK             |
| nickname      | text        | 작성자 닉네임  |
| title         | text        | 제목           |
| content       | text        | 본문           |
| ip_hash       | text        | 작성자 IP 해시 |
| view_count    | integer     | 조회수         |
| comment_count | integer     | 댓글 수        |
| is_hidden     | boolean     | 숨김 처리 여부 |
| created_at    | timestamptz | 작성일         |

**RLS 정책**: SELECT(is_hidden=false), INSERT 허용

### 5. kcl_post_comments (댓글)

| 컬럼       | 타입        | 설명            |
| ---------- | ----------- | --------------- |
| id         | uuid        | PK              |
| post_id    | uuid        | FK -> kcl_posts |
| nickname   | text        | 작성자 닉네임   |
| content    | text        | 댓글 내용       |
| ip_hash    | text        | 작성자 IP 해시  |
| is_hidden  | boolean     | 숨김 처리 여부  |
| created_at | timestamptz | 작성일          |

**RLS 정책**: SELECT(is_hidden=false), INSERT 허용

### 6. kcl_reports (신고)

| 컬럼        | 타입        | 설명                  |
| ----------- | ----------- | --------------------- |
| id          | uuid        | PK                    |
| target_type | text        | 'post' 또는 'comment' |
| target_id   | uuid        | 신고 대상 ID          |
| reason      | text        | 신고 사유 (선택)      |
| ip_hash     | text        | 신고자 IP 해시        |
| created_at  | timestamptz | 신고일                |

**RLS 정책**: INSERT, SELECT(중복 체크용) 허용

## RLS 정책 적용 방법

### 방법 1: Supabase Dashboard

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `policies.sql` 내용 복사/붙여넣기
4. Run 실행

### 방법 2: Supabase CLI

```bash
# 프로젝트 연결
supabase link --project-ref <project-id>

# 마이그레이션으로 적용
supabase db push
```

## 주의사항

1. **정책 재적용 시**: 기존 정책을 먼저 DROP해야 합니다. `policies.sql` 하단의 DROP 명령어 주석을 해제하여 사용하세요.

2. **Service Role Key**: 관리자 기능(게시글 숨김, 사용자 차단 등)은 Service Role Key를 사용해야 합니다. RLS 정책을 우회합니다.

3. **Rate Limiting**: RLS로는 요청 빈도 제한이 불가능합니다. 애플리케이션 레벨(Redis)에서 처리 중입니다.

## 보안 체크리스트

- [x] 모든 테이블에 RLS 활성화
- [x] 공개 데이터는 SELECT만 허용
- [x] 사용자 생성 콘텐츠는 INSERT만 허용
- [x] 삭제는 soft delete (is_hidden) 방식 사용
- [x] IP 해시로 익명 사용자 식별
- [x] 투표 조작 방지 (SELECT/UPDATE/DELETE 차단)

## 관련 코드

- **API Routes**: `packages/kcl/src/app/api/`
- **Supabase Client**: `packages/kcl/src/lib/supabase/`
- **타입 정의**: `packages/kcl/src/types/community.ts`
