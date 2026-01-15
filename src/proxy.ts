/**
 * @file proxy.ts
 * @description Next.js 16+ Proxy 파일 (기존 middleware.ts에서 마이그레이션)
 *
 * Next.js 16부터 `middleware` 컨벤션이 deprecated 되었습니다.
 * 이 파일은 새로운 `proxy` 컨벤션을 따르며, next-intl을 사용한
 * 국제화(i18n) 라우팅을 처리합니다.
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
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
  // 지원되는 모든 로케일 목록
  locales: ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'],

  // 매칭되는 로케일이 없을 경우 사용할 기본 로케일
  defaultLocale: 'en'
});

/**
 * Proxy 함수 (Next.js 16+ 컨벤션)
 *
 * 모든 요청에 대해 국제화 라우팅을 적용합니다.
 * 기존 middleware 함수와 동일한 역할을 수행합니다.
 *
 * @param request - Next.js의 NextRequest 객체
 * @returns 국제화 라우팅이 적용된 Response
 */
export default function proxy(request: NextRequest) {
  return handleI18nRouting(request);
}

/**
 * Proxy 설정
 * - matcher: 국제화 라우팅이 적용될 경로 패턴
 * - 정적 파일(api, _next, _vercel 등)은 제외됩니다.
 */
export const config = {
  // 국제화된 경로에만 매칭 (기존 middleware 설정 유지)
  matcher: ['/', '/(ko|en|id|tr|ja|zh|es|pt|th|vi|fr|de)/:path*']
};
