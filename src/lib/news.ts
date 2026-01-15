/**
 * 뉴스 데이터 접근 레이어
 *
 * Edge Runtime 호환을 위해 fs/path 대신 prebuild 단계에서 생성된 JSON 사용
 * @see scripts/generate-news-json.js
 */

import newsMeta from '@/generated/news-meta.json';

/**
 * 뉴스 게시글 타입 정의
 * 마크다운 파일의 frontmatter와 본문을 포함
 */
export interface NewsPost {
  /** URL용 식별자 (파일명에서 .md 제외) */
  slug: string;
  /** 기사 제목 */
  title: string;
  /** 기사 요약문 (목록 카드용) */
  excerpt: string;
  /** 작성일 (YYYY-MM-DD) */
  date: string;
  /** 마크다운 본문 */
  content: string;
  /** 썸네일 이미지 경로 */
  thumbnail?: string | null;
  /** 카테고리 */
  category?: string;
  /** 언어 코드 */
  locale: string;
}

/**
 * 뉴스 메타데이터 타입 (목록용 - content 미포함)
 */
export interface NewsMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  thumbnail?: string | null;
  category?: string;
  locale: string;
}

/**
 * 특정 언어(locale)의 모든 뉴스 게시글을 가져옵니다.
 * 날짜순(최신순)으로 정렬하여 반환합니다.
 *
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 뉴스 메타데이터 배열
 */
export function getAllNews(locale: string = 'ko'): NewsMeta[] {
  // 해당 로케일의 뉴스만 필터링
  let posts = (newsMeta as NewsMeta[]).filter((post) => post.locale === locale);

  // 해당 언어 콘텐츠가 없으면 영어로 fallback
  if (posts.length === 0 && locale !== 'en') {
    posts = (newsMeta as NewsMeta[]).filter((post) => post.locale === 'en');
  }

  // 날짜 내림차순 정렬 (이미 정렬되어 있지만 안전하게 재정렬)
  return posts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * 슬러그(URL ID)로 특정 뉴스 상세 정보를 가져옵니다.
 * 동적 import를 사용하여 해당 뉴스의 JSON 파일 로드
 *
 * @param slug - 뉴스 식별자
 * @param locale - 언어 코드 (기본값: 'ko')
 * @returns 뉴스 게시글 또는 null
 */
export async function getNewsBySlug(slug: string, locale: string = 'ko'): Promise<NewsPost | null> {
  try {
    // 동적 import로 해당 뉴스 JSON 로드
    const newsModule = await import(`@/generated/news-content/${locale}/${slug}.json`);
    return newsModule.default as NewsPost;
  } catch {
    // 해당 언어 파일이 없으면 영어로 fallback
    if (locale !== 'en') {
      try {
        const fallbackModule = await import(`@/generated/news-content/en/${slug}.json`);
        return fallbackModule.default as NewsPost;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * 모든 뉴스 슬러그를 가져옵니다.
 * generateStaticParams에서 사용
 *
 * @param locale - 언어 코드
 * @returns 슬러그 배열
 */
export function getAllNewsSlugs(locale: string = 'ko'): string[] {
  const posts = getAllNews(locale);
  return posts.map((post) => post.slug);
}

/**
 * 모든 로케일에 대한 뉴스 슬러그 조합 반환
 * generateStaticParams에서 정적 경로 생성용
 *
 * @param locales - 지원 로케일 배열
 * @returns {locale, slug}[] 배열
 */
export function getAllNewsParams(locales: string[]): { locale: string; slug: string }[] {
  const params: { locale: string; slug: string }[] = [];

  for (const locale of locales) {
    const posts = getAllNews(locale);
    for (const post of posts) {
      params.push({ locale, slug: post.slug });
    }
  }

  return params;
}
