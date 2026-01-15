/**
 * @file middleware.ts
 * @description Next.js Middleware for i18n routing (Cloudflare Pages 호환)
 *
 * Cloudflare Pages는 middleware.ts 컨벤션을 사용합니다.
 * next-intl을 사용한 국제화(i18n) 라우팅을 처리합니다.
 *
 * @see https://next-intl.dev/docs/routing/middleware
 */

import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

/**
 * next-intl 라우팅 핸들러 생성
 * - locales: 지원하는 모든 언어 코드 목록
 * - defaultLocale: 일치하는 로케일이 없을 때 사용할 기본 언어
 */
const handleI18nRouting = createMiddleware({
  locales: ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'],
  defaultLocale: 'en',
});

/**
 * Middleware 함수
 *
 * 모든 요청에 대해 국제화 라우팅을 적용합니다.
 *
 * @param request - Next.js의 NextRequest 객체
 * @returns 국제화 라우팅이 적용된 Response
 */
export function middleware(request: NextRequest) {
  return handleI18nRouting(request);
}

/**
 * Middleware 설정
 * - matcher: 국제화 라우팅이 적용될 경로 패턴
 * - 정적 파일(api, _next, _vercel 등)은 제외됩니다.
 */
export const config = {
  matcher: ['/', '/(ko|en|id|tr|ja|zh|es|pt|th|vi|fr|de)/:path*'],
};
