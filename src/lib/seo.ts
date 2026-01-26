/**
 * SEO 유틸리티 함수
 *
 * canonical URL 및 hreflang alternates 생성
 * 다국어 페이지의 중복 콘텐츠 문제 해결을 위한 핵심 유틸리티
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import { Metadata } from 'next';
import { SITE_URL, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './constants';

/**
 * 지원하는 언어 코드 목록 (hreflang용)
 * - 'x-default': 기본 언어 (en)
 */
type LocaleKey = (typeof SUPPORTED_LOCALES)[number] | 'x-default';

/**
 * alternates.languages 객체 생성
 *
 * 12개 언어 + x-default hreflang 생성
 *
 * @param pathname - 경로 (예: '', '/news', '/analytics')
 * @returns hreflang 대체 URL 객체
 */
export function generateAlternateLanguages(pathname: string = ''): Record<LocaleKey, string> {
  const languages: Partial<Record<LocaleKey, string>> = {};

  // 12개 언어에 대한 hreflang 생성
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${SITE_URL}/${locale}${pathname}`;
  }

  // x-default: 기본 언어 (영어)
  languages['x-default'] = `${SITE_URL}/${DEFAULT_LOCALE}${pathname}`;

  return languages as Record<LocaleKey, string>;
}

/**
 * canonical URL 생성
 *
 * 현재 locale의 정규 URL 생성
 *
 * @param locale - 현재 언어 코드
 * @param pathname - 경로 (예: '', '/news', '/analytics')
 * @returns canonical URL
 */
export function generateCanonicalUrl(locale: string, pathname: string = ''): string {
  return `${SITE_URL}/${locale}${pathname}`;
}

/**
 * SEO alternates 메타데이터 생성
 *
 * Next.js Metadata의 alternates 객체 생성
 *
 * @param locale - 현재 언어 코드
 * @param pathname - 경로 (예: '', '/news', '/analytics')
 * @returns Metadata['alternates'] 객체
 */
export function generateAlternates(locale: string, pathname: string = ''): Metadata['alternates'] {
  return {
    canonical: generateCanonicalUrl(locale, pathname),
    languages: generateAlternateLanguages(pathname),
  };
}

/**
 * 동적 라우트용 SEO alternates 생성
 *
 * [slug] 같은 동적 세그먼트가 포함된 경로용
 *
 * @param locale - 현재 언어 코드
 * @param basePath - 기본 경로 (예: '/news')
 * @param dynamicSegment - 동적 세그먼트 (예: 'my-article-slug')
 * @returns Metadata['alternates'] 객체
 */
export function generateDynamicAlternates(
  locale: string,
  basePath: string,
  dynamicSegment: string,
): Metadata['alternates'] {
  const fullPath = `${basePath}/${dynamicSegment}`;
  return generateAlternates(locale, fullPath);
}
