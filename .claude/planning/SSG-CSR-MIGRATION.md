# KCL SSG/CSR 마이그레이션 계획서

> **버전**: 1.0  
> **작성일**: 2025-01-19  
> **작성자**: Jeff Dean (CTO)  
> **상태**: 계획 수립 완료

---

## 1. 개요

### 1.1 목적
KCL 프로젝트를 SSR(Server-Side Rendering) 아키텍처에서 SSG/CSR(Static Site Generation + Client-Side Rendering) 아키텍처로 전환하여 인프라 비용을 절감하고 배포 단순화

### 1.2 배경
- MVP 1단계 완료 상태
- 현재 Cloudflare Workers에서 SSR 운영 중
- 인프라 비용 최적화 필요
- 트래픽 증가 시 점진적 확장 전략 (A → B 옵션)

### 1.3 백업 브랜치
```
backup/ssr-architecture-v1 (commit: f8c894e)
```
> 롤백 필요 시 이 브랜치로 복구 가능

---

## 2. 현재 vs 목표 아키텍처

### 2.1 현재 아키텍처 (SSR)

```
┌─────────────────────────────────────────────────────────────┐
│                     현재 (SSR)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client (Browser)                                          │
│        │                                                    │
│        ▼                                                    │
│   Cloudflare Workers (Next.js SSR)                         │
│        │                                                    │
│        ├──► API Routes (/api/*)                            │
│        │        │                                           │
│        │        ├──► Upstash Redis (캐시)                   │
│        │        │                                           │
│        │        └──► Supabase (DB, Auth)                   │
│        │                                                    │
│        └──► Server Components (SSR 렌더링)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

비용: Cloudflare Workers 유료 가능성 + Upstash Redis ($0~$10)
```

### 2.2 목표 아키텍처 (SSG/CSR)

```
┌─────────────────────────────────────────────────────────────┐
│                     목표 (SSG/CSR)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Client (Browser)                                          │
│        │                                                    │
│        ├──► 정적 HTML/JS (CDN 캐시)                        │
│        │        │                                           │
│        │        └──► SSG 빌드된 페이지                      │
│        │                                                    │
│        └──► SWR (CSR)                                      │
│                 │                                           │
│                 └──► Supabase 직접 호출                     │
│                          │                                  │
│                          ├──► Database                      │
│                          └──► Auth                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

비용: Cloudflare Pages 무료 + Supabase 무료 = $0
```

---

## 3. 영향 범위 분석

### 3.1 파일별 영향도

| 파일/디렉토리 | 변경 필요 | 영향도 | 설명 |
|--------------|----------|--------|------|
| `next.config.mjs` | O | 높음 | `output: 'export'` 설정 |
| `src/app/api/**` | O | 높음 | 제거 또는 비활성화 |
| `src/lib/redis.ts` | O | 높음 | 제거 |
| `src/lib/supabase/client.ts` | O | 중간 | 클라이언트 전용으로 통합 |
| `src/lib/supabase/server.ts` | O | 높음 | 제거 (SSG 빌드용만 유지) |
| `src/app/[locale]/page.tsx` | O | 중간 | Server Component → 정적 |
| `src/app/[locale]/HomeClient.tsx` | X | 낮음 | 이미 CSR (SWR 사용) |
| `src/app/[locale]/news/**` | X | 낮음 | 이미 SSG 친화적 |
| `src/hooks/useLeagueData.ts` | O | 중간 | Supabase 직접 호출로 변경 |
| `src/hooks/useVote.ts` | O | 중간 | Supabase 직접 호출로 변경 |
| `package.json` | O | 낮음 | Redis 의존성 제거 |
| `wrangler.jsonc` | O | 중간 | 불필요 (Pages 사용) |

### 3.2 API Routes 목록 (제거 대상)

| Route | 현재 역할 | 대체 방안 |
|-------|----------|----------|
| `/api/companies` | 소속사 목록 조회 | Supabase 직접 호출 |
| `/api/companies/[id]` | 소속사 상세 조회 | Supabase 직접 호출 |
| `/api/companies/[id]/groups` | 그룹 목록 조회 | Supabase 직접 호출 |
| `/api/vote` | 투표 처리 | Supabase 직접 호출 + RLS |
| `/api/hall-of-fame` | 명예의 전당 조회 | Supabase 직접 호출 |
| `/api/community/posts` | 커뮤니티 글 CRUD | Supabase 직접 호출 + RLS |
| `/api/community/posts/[id]` | 글 상세/수정/삭제 | Supabase 직접 호출 + RLS |
| `/api/community/posts/[id]/comments` | 댓글 CRUD | Supabase 직접 호출 + RLS |
| `/api/community/report` | 신고 기능 | Supabase 직접 호출 + RLS |

---

## 4. 마이그레이션 단계

### Phase 0: 준비 (0.5일) ✅ 완료

- [x] 백업 브랜치 생성 (`backup/ssr-architecture-v1`)
- [x] 마이그레이션 계획서 작성
- [x] Supabase RLS 정책 검토 및 보강

### Phase 1: Supabase 클라이언트 통합 (1일) ✅ 완료

**목표**: 서버/클라이언트 Supabase 클라이언트를 클라이언트 전용으로 통합

**작업 목록**:
- [x] `src/lib/supabase/client.ts` 리팩토링
- [x] `src/lib/supabase/server.ts` 제거 (또는 빌드 전용으로 분리)
- [x] 환경 변수 정리 (`NEXT_PUBLIC_*`만 사용)

**파일 변경**:
```
src/lib/supabase/
├── client.ts      (수정) - 브라우저 전용 클라이언트
├── server.ts      (제거) - SSR용 클라이언트
└── index.ts       (수정) - export 정리
```

### Phase 2: 데이터 페칭 레이어 마이그레이션 (1.5일) ✅ 완료

**목표**: API Routes 호출을 Supabase 직접 호출로 변경

**작업 목록**:
- [x] `src/lib/api/companies.ts` 생성 (Supabase 직접 호출)
- [x] `src/lib/api/vote.ts` 생성 (Supabase 직접 호출)
- [x] `src/lib/api/community.ts` 생성 (Supabase 직접 호출)
- [x] `src/hooks/useLeagueData.ts` 수정 (새 API 레이어 사용)
- [x] `src/hooks/useVote.ts` 수정 (새 API 레이어 사용)

**새 파일 구조**:
```
src/lib/api/
├── companies.ts   (신규) - 소속사 관련 Supabase 쿼리
├── vote.ts        (신규) - 투표 관련 Supabase 쿼리
├── community.ts   (신규) - 커뮤니티 관련 Supabase 쿼리
└── index.ts       (신규) - 통합 export
```

### Phase 3: API Routes 제거 및 Redis 정리 (0.5일) ✅ 완료

**목표**: 불필요한 서버 코드 제거

**작업 목록**:
- [x] `src/app/api/` 디렉토리 제거 (→ `_api_backup_phase3/`로 백업)
- [x] `src/lib/redis.ts` 제거
- [x] `package.json`에서 Redis 의존성 제거
  - `@upstash/redis`
  - `@upstash/ratelimit`
- [x] 환경 변수 정리 (UPSTASH_* 제거)

### Phase 4: Next.js 설정 변경 (0.5일) ✅ 완료 (2025-01-19)

**목표**: SSG export 모드로 전환

**작업 목록**:
- [x] `next.config.mjs` 수정
  ```javascript
  const nextConfig = {
    output: 'export',  // 정적 빌드
    images: {
      unoptimized: true,  // 이미지 최적화 비활성화
    },
    // ... 기타 설정
  };
  ```
- [x] `wrangler.jsonc` → `wrangler.jsonc.bak.old` 백업
- [x] `open-next.config.ts` → `open-next.config.ts.bak.old` 백업
- [x] 메타데이터 라우트에 `dynamic = 'force-static'` 추가
  - `src/app/sitemap.ts`
  - `src/app/robots.ts`
  - `src/app/manifest.ts`

### Phase 5: 페이지 컴포넌트 정리 (1일) ✅ 완료

**목표**: Server Components를 정적/클라이언트 컴포넌트로 변환

**작업 목록**:
- [x] `src/app/[locale]/page.tsx` - 정적 셸 + CSR 데이터
- [x] `src/app/[locale]/company/[id]/page.tsx` - generateStaticParams 추가
- [x] `src/app/[locale]/hall-of-fame/page.tsx` - 정적 셸 + CSR 데이터
- [x] `src/app/[locale]/analytics/page.tsx` - 정적 셸 + CSR 데이터

### Phase 6: 빌드 및 배포 설정 (0.5일) ✅ 완료 (2025-01-19)

**목표**: Cloudflare Pages 정적 배포 설정

**작업 목록**:
- [x] 빌드 스크립트 확인 (`pnpm build` → 391개 정적 페이지 생성)
- [x] `out/` 디렉토리 생성 확인
- [x] GitHub Actions 워크플로우 주석 업데이트
- [x] Cloudflare Pages 설정 문서화 (`DEPLOY.md` 생성)
- [x] 환경 변수 목록 정리

### Phase 7: 테스트 및 검증 (1일) 🔄 Viper 담당 (대기 중)

**목표**: 전체 기능 동작 확인

**테스트 체크리스트**:
- [ ] 홈페이지 로딩 및 랭킹 표시
- [ ] 투표 기능 정상 작동
- [ ] 로그인/로그아웃
- [ ] 뉴스 페이지 (정적 생성 확인)
- [ ] 회사 상세 페이지
- [ ] 명예의 전당
- [ ] 커뮤니티 (글 작성, 댓글)
- [ ] 다국어 전환 (12개 언어)
- [ ] SEO 메타데이터 확인
- [ ] 모바일 반응형

---

## 5. 상세 구현 가이드

### 5.1 Supabase 직접 호출 패턴

**Before (API Route 경유)**:
```typescript
// src/hooks/useLeagueData.ts
const fetcher = (url: string) => fetch(url).then(res => res.json());
const { data } = useSWR('/api/companies', fetcher);
```

**After (Supabase 직접 호출)**:
```typescript
// src/lib/api/companies.ts
import { supabase } from '@/lib/supabase/client';

export async function getCompanies() {
  const { data, error } = await supabase
    .from('kcl_companies')
    .select(`
      id, name_ko, name_en, slug, logo_url, gradient_color,
      rank, firepower, league_tier,
      groups:kcl_groups (id, name_ko, name_en, vote_count)
    `)
    .order('firepower', { ascending: false });
  
  if (error) throw error;
  return data;
}

// src/hooks/useLeagueData.ts
import { getCompanies } from '@/lib/api/companies';

const { data } = useSWR('companies', getCompanies, {
  refreshInterval: 20000,
});
```

### 5.2 투표 기능 (RLS 보호)

**Supabase RLS 정책 확인 필요**:
```sql
-- 투표 테이블 RLS
ALTER TABLE kcl_votes ENABLE ROW LEVEL SECURITY;

-- 인증된 사용자만 투표 가능
CREATE POLICY "Users can insert own votes" ON kcl_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 중복 투표 방지는 unique constraint로 처리
```

**클라이언트 투표 코드**:
```typescript
// src/lib/api/vote.ts
export async function submitVote(groupId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인 필요');

  const { error } = await supabase
    .from('kcl_votes')
    .insert({ group_id: groupId, user_id: user.id });
  
  if (error) throw error;
}
```

### 5.3 정적 페이지 생성

**다국어 정적 경로 생성**:
```typescript
// src/app/[locale]/page.tsx
import { locales } from '@/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function HomePage() {
  // 정적 셸 렌더링
  return (
    <main>
      <h1>KCL</h1>
      {/* CSR 컴포넌트가 데이터 로드 */}
      <HomeClient />
    </main>
  );
}
```

---

## 6. 롤백 계획

### 6.1 롤백 트리거 조건

- 빌드 실패가 3회 이상 연속
- 주요 기능(투표, 로그인) 완전 불가
- SEO 지표 급격한 하락 (1주 후 확인)

### 6.2 롤백 절차

```bash
# 1. 백업 브랜치로 복구
git checkout main
git reset --hard backup/ssr-architecture-v1

# 2. 강제 푸시 (주의!)
git push origin main --force

# 3. 배포 재실행
# GitHub Actions가 자동으로 이전 아키텍처 배포
```

---

## 7. 일정 요약

| Phase | 작업 | 예상 시간 | 담당 |
|-------|------|----------|------|
| 0 | 준비 (백업, 계획서) | 0.5일 | Jeff Dean |
| 1 | Supabase 클라이언트 통합 | 1일 | Kai |
| 2 | 데이터 페칭 레이어 | 1.5일 | Kai |
| 3 | API Routes/Redis 제거 | 0.5일 | Max |
| 4 | Next.js 설정 변경 | 0.5일 | Max |
| 5 | 페이지 컴포넌트 정리 | 1일 | Luna |
| 6 | 빌드/배포 설정 | 0.5일 | Max |
| 7 | 테스트 및 검증 | 1일 | Viper |
| **총계** | | **6.5일** | |

---

## 8. 성공 기준

- [ ] `pnpm build` 성공 (정적 파일 생성)
- [ ] 모든 페이지 정상 로딩
- [ ] 투표 기능 정상 작동
- [ ] 인증 플로우 정상 작동
- [ ] Lighthouse 성능 점수 90+ 유지
- [ ] SEO 메타데이터 정상 생성
- [ ] 12개 언어 모두 접근 가능

---

## 9. 향후 확장 계획 (Option B)

트래픽 증가 시 아래 작업 수행:

1. **Supabase Edge Functions 도입**
   - `src/lib/api/*.ts` → Edge Functions으로 이전
   - Redis 캐싱 복원

2. **전환 시점 기준**
   - 일일 API 호출 > 50,000
   - Supabase Bandwidth > 4GB/월
   - DB 응답 시간 > 500ms

---

## 10. 참고 문서

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [SWR - React Hooks for Data Fetching](https://swr.vercel.app/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)

---

**문서 끝**
