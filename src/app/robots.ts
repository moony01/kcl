import { MetadataRoute } from 'next';
import { FULL_URL } from '@/lib/constants';

/**
 * KCL robots.txt 생성기
 *
 * SEO 최적화:
 * - 검색 엔진 크롤러 허용/차단 규칙
 * - 비공개 페이지 크롤링 차단
 * - sitemap 위치 명시
 *
 * 참고: AI 크롤러 차단(GPTBot, ChatGPT-User, CCBot, Google-Extended)은
 * Cloudflare에서 관리하므로 여기서는 제외합니다.
 * Cloudflare Dashboard > Security > Bots에서 설정 확인 가능.
 *
 * SSG 모드에서 빌드 시점에 정적 생성됩니다.
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Next.js 내부 경로
          '/_next/',

          // 인증 관련 페이지 (검색 불필요)
          '/*/login',
          '/*/signup',

          // 개인 페이지 (로그인 필요)
          '/*/profile',
          '/*/my',

          // API 경로 (SSG에서는 없지만 방어적으로)
          '/api/',
        ],
      },
    ],
    sitemap: `${FULL_URL}/sitemap.xml`,
    host: FULL_URL,
  };
}
