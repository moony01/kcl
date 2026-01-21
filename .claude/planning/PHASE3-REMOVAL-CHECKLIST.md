# Phase 3: API Routes/Redis 제거 체크리스트

> **상태**: Kai의 Phase 2 완료 대기 중
> **작성일**: 2025-01-19
> **담당**: Max (Principal Engineer)

---

## 1. 제거 대상 파일 목록

### 1.1 API Routes (9개 파일)

```
src/app/api/
├── companies/
│   ├── route.ts                    # 소속사 목록 API
│   └── [id]/
│       ├── route.ts                # 소속사 상세 API
│       └── groups/
│           └── route.ts            # 그룹 목록 API
├── vote/
│   └── route.ts                    # 투표 API
├── hall-of-fame/
│   └── route.ts                    # 명예의 전당 API
└── community/
    ├── posts/
    │   ├── route.ts                # 게시글 목록/작성 API
    │   └── [id]/
    │       ├── route.ts            # 게시글 상세/수정/삭제 API
    │       └── comments/
    │           └── route.ts        # 댓글 CRUD API
    └── report/
        └── route.ts                # 신고 API
```

**삭제 명령어**:
```bash
# 옵션 1: 완전 삭제
rm -rf packages/kcl/src/app/api

# 옵션 2: 비활성화 (백업용)
mv packages/kcl/src/app/api packages/kcl/src/app/_api_backup
```

### 1.2 Redis 관련 파일 (1개)

```
src/lib/redis.ts                    # Upstash Redis 클라이언트 및 캐시 유틸리티
```

**삭제 명령어**:
```bash
rm packages/kcl/src/lib/redis.ts
```

---

## 2. 제거 대상 의존성 (package.json)

### 2.1 dependencies에서 제거

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@upstash/ratelimit` | ^2.0.8 | API Rate Limiting |
| `@upstash/redis` | ^1.36.1 | Redis 캐시 클라이언트 |

### 2.2 devDependencies에서 제거

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@opennextjs/cloudflare` | ^1.14.8 | Cloudflare Workers SSR |
| `wrangler` | ^4.59.2 | Cloudflare Workers CLI |

**주의**: wrangler는 Cloudflare Pages CLI로도 사용되므로, 완전 제거 전 Pages 배포 스크립트 확인 필요.

### 2.3 package.json 수정 후 실행

```bash
pnpm --filter kcl remove @upstash/ratelimit @upstash/redis
pnpm --filter kcl remove -D @opennextjs/cloudflare
pnpm install
```

---

## 3. 환경 변수 정리 목록

### 3.1 제거 대상 (wrangler.jsonc 및 .env)

| 변수명 | 용도 | 상태 |
|--------|------|------|
| `UPSTASH_REDIS_REST_URL` | Redis REST API URL | Phase 3에서 제거 |
| `UPSTASH_REDIS_REST_TOKEN` | Redis 인증 토큰 | Phase 3에서 제거 |
| `CACHE_ENABLED` | Redis 캐시 활성화 여부 | Phase 3에서 제거 |

### 3.2 유지 (Supabase 직접 호출에 필요)

| 변수명 | 용도 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 |

### 3.3 Cloudflare Dashboard 정리

Cloudflare Workers 환경 변수에서도 UPSTASH_* 변수 제거 필요.

---

## 4. Supabase RLS 정책 현황

### 4.1 현재 정책 요약 (`supabase/policies.sql`)

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `kcl_companies` | O (공개) | X | X | X |
| `kcl_groups` | O (공개) | X | X | X |
| `kcl_votes` | X | O | X | X |
| `kcl_posts` | O (is_hidden=false) | O | X | X |
| `kcl_post_comments` | O (is_hidden=false) | O | X | X |
| `kcl_reports` | O (중복체크) | O | X | X |

### 4.2 SSG/CSR 전환 후 추가 검토 필요

1. **투표 기능**: 현재 Rate Limiting이 Redis로 처리됨
   - RLS만으로 중복 방지가 충분한지 확인 필요
   - 대안: Supabase Edge Functions에서 Rate Limiting

2. **커뮤니티 기능**: IP 해시 기반 익명 사용자 식별
   - 클라이언트에서 IP 해시 생성 방법 확인 필요
   - 대안: Supabase Edge Functions에서 IP 해시 처리

---

## 5. 빌드 스크립트 정리

### 5.1 제거 대상 스크립트 (package.json scripts)

| 스크립트 | 용도 | 상태 |
|----------|------|------|
| `cf:build` | OpenNext 빌드 | 제거 |
| `cf:deploy` | Workers 배포 | 제거 |
| `cf:preview` | Workers 프리뷰 | 제거 |

### 5.2 수정 후 스크립트

```json
{
  "scripts": {
    "dev": "next dev",
    "prebuild": "node scripts/generate-news-json.js",
    "build": "pnpm prebuild && next build",
    "start": "next start",  // 정적 빌드에서는 불필요하지만 유지
    "lint": "eslint",
    "test": "vitest"
  }
}
```

---

## 6. Phase 3 실행 절차 (Kai 완료 후)

### Step 1: API Routes 비활성화
```bash
cd packages/kcl
mv src/app/api src/app/_api_backup
```

### Step 2: Redis 파일 삭제
```bash
rm src/lib/redis.ts
```

### Step 3: 의존성 제거
```bash
pnpm --filter kcl remove @upstash/ratelimit @upstash/redis
pnpm --filter kcl remove -D @opennextjs/cloudflare
```

### Step 4: 빌드 스크립트 정리
- `package.json`에서 `cf:*` 스크립트 제거

### Step 5: 빌드 테스트
```bash
pnpm --filter kcl build
```

### Step 6: out/ 디렉토리 확인
```bash
ls -la packages/kcl/out/
```

---

## 7. 롤백 계획

### 백업 브랜치
```
backup/ssr-architecture-v1 (commit: f8c894e)
```

### 백업 파일
- `wrangler.jsonc.bak`
- `open-next.config.ts.bak`
- `src/app/_api_backup/` (Phase 3 실행 후)

### 롤백 명령어
```bash
git checkout main
git reset --hard backup/ssr-architecture-v1
git push origin main --force
```

---

**문서 끝**
