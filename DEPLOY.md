# KCL 배포 가이드

> **버전**: 1.0  
> **업데이트**: 2025-01-19  
> **아키텍처**: SSG/CSR (Static Site Generation + Client-Side Rendering)

---

## 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     KCL 배포 파이프라인                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   plolux 모노레포 (main 브랜치)                              │
│        │                                                    │
│        ▼                                                    │
│   GitHub Actions (deploy.yml)                               │
│        │                                                    │
│        └──► sync-to-kcl job                                │
│                 │                                           │
│                 ▼                                           │
│   plozen/kcl 리포지토리                                     │
│        │                                                    │
│        ▼                                                    │
│   Cloudflare Pages (자동 빌드/배포)                         │
│        │                                                    │
│        └──► CDN 배포 (정적 HTML/JS/CSS)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Cloudflare Pages 설정

### 빌드 설정

| 항목                       | 값                           |
| -------------------------- | ---------------------------- |
| **Framework preset**       | Next.js (Static HTML Export) |
| **Build command**          | `pnpm build`                 |
| **Build output directory** | `out`                        |
| **Root directory**         | `/` (리포지토리 루트)        |
| **Node.js version**        | 20.x                         |

### 환경 변수 (필수)

Cloudflare Pages 대시보드에서 설정:

| 변수명                          | 설명                  | 예시                      | SEO 영향 |
| ------------------------------- | --------------------- | ------------------------- | -------- |
| `NEXT_PUBLIC_SITE_URL`          | 사이트 기본 URL       | `https://www.kclhq.com`   | **필수** |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 프로젝트 URL | `https://xxx.supabase.co` | -        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키      | `eyJhbGci...`             | -        |

> ⚠️ **중요**: `NEXT_PUBLIC_SITE_URL`이 설정되지 않으면 sitemap.xml과 robots.txt에 `localhost:3000`이 들어가 Google Search Console 등록이 불가능합니다!

### SEO 파일 (자동 생성)

빌드 시 다음 파일이 자동 생성됩니다:

| 파일            | 경로             | 설명                                     |
| --------------- | ---------------- | ---------------------------------------- |
| `sitemap.xml`   | `/sitemap.xml`   | 12개 언어 전체 URL + hreflang alternates |
| `robots.txt`    | `/robots.txt`    | 크롤러 규칙 + sitemap 위치               |
| `manifest.json` | `/manifest.json` | PWA 설정                                 |

### Google Search Console 등록

1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가: `https://www.kclhq.com`
3. Sitemaps → `https://www.kclhq.com/sitemap.xml` 제출

### 제거된 환경 변수 (SSG 마이그레이션 후 불필요)

다음 변수들은 더 이상 필요하지 않습니다:

- ~~`NEXT_PUBLIC_BASE_URL`~~ → `NEXT_PUBLIC_SITE_URL`로 변경됨
- ~~`UPSTASH_REDIS_REST_URL`~~ (Redis 캐시 제거)
- ~~`UPSTASH_REDIS_REST_TOKEN`~~ (Redis 캐시 제거)
- ~~`CACHE_ENABLED`~~ (서버사이드 캐시 불필요)
- ~~`SUPABASE_SERVICE_ROLE_KEY`~~ (서버사이드 코드 제거)

---

## 로컬 개발

### 개발 서버 실행

```bash
# 모노레포 루트에서
pnpm --filter kcl dev
```

### 프로덕션 빌드 테스트

```bash
# 빌드
pnpm --filter kcl build

# 정적 서버로 테스트
cd packages/kcl
npx serve out
```

### 빌드 출력 확인

```bash
# out/ 디렉토리 구조 확인
ls -la packages/kcl/out/

# 생성된 페이지 수 확인
find packages/kcl/out -name "*.html" | wc -l
```

---

## 보안 헤더

`public/_headers` 파일로 Cloudflare Pages에서 보안 헤더 설정:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-XSS-Protection: 1; mode=block
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 문제 해결

### 빌드 실패: "output: export" 관련 오류

메타데이터 라우트(sitemap.ts, robots.ts, manifest.ts)에 `export const dynamic = 'force-static'` 추가 필요:

```typescript
// src/app/sitemap.ts
export const dynamic = 'force-static';

export default function sitemap() {
  // ...
}
```

### 이미지 최적화 오류

SSG 모드에서는 Next.js Image Optimization이 비활성화됩니다.
`next.config.mjs`에서 `images.unoptimized: true` 설정 확인.

### 환경 변수 접근 불가

SSG 빌드에서는 빌드 시점에만 환경 변수가 주입됩니다.
런타임에 동적으로 변경 불가. Cloudflare Pages 대시보드에서 환경 변수 설정 후 재배포 필요.

---

## 마이그레이션 히스토리

| 날짜       | 변경사항                                               |
| ---------- | ------------------------------------------------------ |
| 2026-01-21 | SEO 개선: sitemap 12개 언어 지원 + hreflang alternates |
| 2026-01-21 | 환경 변수 정리: NEXT_PUBLIC_SITE_URL 표준화            |
| 2025-01-19 | SSR → SSG/CSR 마이그레이션 완료                        |
| 2025-01-19 | Cloudflare Workers → Cloudflare Pages 전환             |
| 2025-01-19 | Redis 캐시 제거, Supabase 직접 호출                    |
| 2025-01-19 | API Routes 제거, 클라이언트 SWR 데이터 페칭            |

---

## 참고 문서

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Pages - Static Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/)
- [KCL SSG/CSR 마이그레이션 계획서](./.claude/planning/SSG-CSR-MIGRATION.md)
