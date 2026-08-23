/**
 * 사이트 URL 상수
 *
 * 환경 변수 우선순위:
 * 1. NEXT_PUBLIC_SITE_URL (권장)
 * 2. 프로덕션 기본값: https://mearrow.com
 *
 * 배포 환경에서는 NEXT_PUBLIC_SITE_URL을 명시적으로 주입한다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mearrow.com';

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
