/**
 * 사이트 URL 상수
 *
 * 환경 변수 우선순위:
 * 1. NEXT_PUBLIC_SITE_URL (권장)
 * 2. 프로덕션 기본값: https://www.kclhq.com
 *
 * Cloudflare Workers 환경 변수 설정 필수!
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kclhq.com';

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const FULL_URL = `${SITE_URL}${BASE_PATH}`;

/**
 * 지원 언어 목록 (7개)
 * sitemap, i18n 등에서 공통 사용
 */
export const SUPPORTED_LOCALES = [
  'ko',
  'en',
  'ja',
  'zh',
  'es',
  'fr',
  'de',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** 기본 언어 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** Google AdSense Publisher ID */
export const ADSENSE_PUBLISHER_ID = 'ca-pub-8955182453510440';
