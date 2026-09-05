/**
 * SEO 유틸리티 함수
 *
 * canonical URL 및 hreflang alternates 생성
 * 다국어 페이지의 중복 콘텐츠 문제 해결을 위한 핵심 유틸리티
 *
 * @see https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import { Metadata } from 'next';
import { FULL_URL, SUPPORTED_LOCALES, DEFAULT_LOCALE } from './constants';
import { BRAND_NAME } from './brand';

/**
 * alternates.languages 객체 생성
 *
 * 지원 언어 + x-default hreflang 생성
 *
 * @param pathname - 경로 (예: '', '/news', '/hall-of-fame')
 * @returns hreflang 대체 URL 객체
 */
export function generateAlternateLanguages(
  pathname: string = '',
  availableLocales: readonly string[] = SUPPORTED_LOCALES,
  defaultLocale: string = DEFAULT_LOCALE,
): Record<string, string> {
  const languages: Record<string, string> = {};

  // 지원 로케일에 대한 hreflang 생성
  for (const locale of availableLocales) {
    if (!SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number])) continue;
    languages[locale] = `${FULL_URL}/${locale}${pathname}`;
  }

  const resolvedDefaultLocale = availableLocales.includes(defaultLocale)
    ? defaultLocale
    : availableLocales.find((locale) =>
        SUPPORTED_LOCALES.includes(locale as typeof SUPPORTED_LOCALES[number]),
      ) || DEFAULT_LOCALE;
  languages['x-default'] = `${FULL_URL}/${resolvedDefaultLocale}${pathname}`;

  return languages;
}

/**
 * canonical URL 생성
 *
 * 현재 locale의 정규 URL 생성
 *
 * @param locale - 현재 언어 코드
 * @param pathname - 경로 (예: '', '/news', '/hall-of-fame')
 * @returns canonical URL
 */
export function generateCanonicalUrl(locale: string, pathname: string = ''): string {
  return `${FULL_URL}/${locale}${pathname}`;
}

/**
 * SEO alternates 메타데이터 생성
 *
 * Next.js Metadata의 alternates 객체 생성
 *
 * @param locale - 현재 언어 코드
 * @param pathname - 경로 (예: '', '/news', '/hall-of-fame')
 * @returns Metadata['alternates'] 객체
 */
export function generateAlternates(
  locale: string,
  pathname: string = '',
  availableLocales: readonly string[] = SUPPORTED_LOCALES,
  defaultLocale: string = DEFAULT_LOCALE,
): Metadata['alternates'] {
  return {
    canonical: generateCanonicalUrl(locale, pathname),
    languages: generateAlternateLanguages(pathname, availableLocales, defaultLocale),
  };
}

const OPEN_GRAPH_LOCALES: Record<string, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  ja: 'ja_JP',
  zh: 'zh_CN',
  es: 'es_ES',
  fr: 'fr_FR',
  de: 'de_DE',
};

const SEO_TITLE_MAX_LENGTH = 60;
const SEO_DESCRIPTION_MAX_LENGTH = 150;

/** Collapse formatting whitespace without changing CJK or other text content. */
export function normalizeSeoText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

/** Truncate by Unicode code point so surrogate pairs are never split. */
export function truncateSeoText(value: string, maxLength: number): string {
  const normalized = normalizeSeoText(value);
  const characters = Array.from(normalized);
  if (characters.length <= maxLength) return normalized;
  if (maxLength <= 1) return '…'.slice(0, maxLength);
  return `${characters.slice(0, maxLength - 1).join('')}…`;
}

/** Keep a trailing ` | Brand` suffix intact when a title must be shortened. */
export function truncateSeoTitle(value: string, maxLength = SEO_TITLE_MAX_LENGTH): string {
  const normalized = normalizeSeoText(value);
  if (Array.from(normalized).length <= maxLength) return normalized;

  const separatorIndex = normalized.lastIndexOf(' | ');
  if (separatorIndex > 0) {
    const suffix = normalized.slice(separatorIndex);
    const suffixLength = Array.from(suffix).length;
    if (suffixLength < maxLength) {
      const base = normalized.slice(0, separatorIndex);
      return `${truncateSeoText(base, maxLength - suffixLength)}${suffix}`;
    }
  }

  return truncateSeoText(normalized, maxLength);
}

export interface PageMetadataOptions {
  locale: string;
  title: string;
  description: string;
  pathname?: string;
  /** Locales with an actual translation for this page. */
  availableLocales?: readonly string[];
  /** Locale used by x-default when availableLocales is restricted. */
  defaultLocale?: string;
  imagePath?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

function absoluteSeoUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${FULL_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

/**
 * 공개 페이지에서 동일하게 사용하는 localized SEO metadata 생성기.
 * 각 페이지가 자체 canonical/OG URL을 소유하도록 하여 layout metadata의
 * 홈 URL 상속으로 인한 잘못된 소셜 미리보기를 방지합니다.
 */
export function generatePageMetadata({
  locale,
  title,
  description,
  pathname = '',
  availableLocales = SUPPORTED_LOCALES,
  defaultLocale = DEFAULT_LOCALE,
  imagePath,
  type = 'website',
  publishedTime,
  modifiedTime,
}: PageMetadataOptions): Metadata {
  const canonical = generateCanonicalUrl(locale, pathname);
  const imageUrl = absoluteSeoUrl(imagePath || `/${locale}/opengraph-image`);
  const finalTitle = truncateSeoTitle(title);
  const finalDescription = truncateSeoText(description, SEO_DESCRIPTION_MAX_LENGTH);
  const alternateLocales = availableLocales.filter(
    (supportedLocale) =>
      supportedLocale !== locale &&
      SUPPORTED_LOCALES.includes(supportedLocale as typeof SUPPORTED_LOCALES[number]),
  );
  const openGraphBase = {
    title: finalTitle,
    description: finalDescription,
    url: canonical,
    siteName: BRAND_NAME,
    locale: OPEN_GRAPH_LOCALES[locale] || OPEN_GRAPH_LOCALES[DEFAULT_LOCALE],
    ...(alternateLocales.length > 0
      ? {
          alternateLocale: alternateLocales.map(
            (supportedLocale) => OPEN_GRAPH_LOCALES[supportedLocale],
          ),
        }
      : {}),
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: finalTitle,
      },
    ],
  };

  const openGraph = type === 'article'
    ? {
        ...openGraphBase,
        type: 'article' as const,
        ...(publishedTime ? { publishedTime } : {}),
        ...(modifiedTime ? { modifiedTime } : {}),
      }
    : {
        ...openGraphBase,
        type: 'website' as const,
      };

  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [imageUrl],
    },
    alternates: generateAlternates(locale, pathname, availableLocales, defaultLocale),
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
