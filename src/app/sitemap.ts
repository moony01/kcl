import { MetadataRoute } from 'next';
import { FULL_URL, SUPPORTED_LOCALES, SupportedLocale } from '@/lib/constants';
import { getAllNews } from '@/lib/news';

/**
 * KCL 사이트맵 생성기
 *
 * SEO 최적화:
 * - 12개 언어 전체 지원
 * - hreflang alternates 포함 (다국어 SEO)
 * - 모든 공개 페이지 포함
 * - 주요 언어(en, ko)와 기타 언어의 priority 차등화
 * - 최신 뉴스에 높은 priority 부여
 *
 * SSG 모드에서 빌드 시점에 정적 생성됩니다.
 * Google Search Console에서 /sitemap.xml로 제출하세요.
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

/**
 * 주요 언어 목록 (트래픽 기준)
 * 이 언어들은 priority를 그대로 유지하고, 나머지는 약간 낮춤
 */
const PRIMARY_LOCALES: SupportedLocale[] = ['en', 'ko', 'ja', 'zh'];

/**
 * 최신 뉴스로 간주할 개수
 * 최신 N개의 뉴스는 높은 priority (0.7) 부여
 */
const RECENT_NEWS_COUNT = 5;

/**
 * 모든 언어에 대한 alternates 객체 생성
 * Google이 각 언어 버전을 올바르게 인식하도록 hreflang 제공
 */
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};

  for (const locale of SUPPORTED_LOCALES) {
    alternates[locale] = `${FULL_URL}/${locale}${path}`;
  }

  // x-default: 언어 감지 전 기본 페이지 (영어)
  alternates['x-default'] = `${FULL_URL}/en${path}`;

  return alternates;
}

/**
 * 언어별 priority 조정
 * 주요 언어는 원래 priority, 기타 언어는 0.1 낮춤 (최소 0.1)
 */
function getLocalePriority(basePriority: number, locale: SupportedLocale): number {
  if (PRIMARY_LOCALES.includes(locale)) {
    return basePriority;
  }
  return Math.max(0.1, basePriority - 0.1);
}

/**
 * 정적 페이지 정의
 * priority: 검색 엔진에 대한 페이지 중요도 (0.0 ~ 1.0)
 * changeFrequency: 콘텐츠 업데이트 빈도
 */
interface StaticPage {
  path: string;
  priority: number;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

const STATIC_PAGES: StaticPage[] = [
  // 메인 페이지 (리그 랭킹)
  { path: '', priority: 1.0, changeFrequency: 'daily' },

  // 분석 페이지
  { path: '/analytics', priority: 0.9, changeFrequency: 'daily' },

  // 명예의 전당
  { path: '/hall-of-fame', priority: 0.8, changeFrequency: 'weekly' },

  // 뉴스 목록
  { path: '/news', priority: 0.8, changeFrequency: 'daily' },

  // 커뮤니티
  { path: '/community', priority: 0.7, changeFrequency: 'hourly' },

  // 법적 페이지
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const buildDate = new Date();
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. 루트 페이지 (언어 리다이렉트)
  sitemapEntries.push({
    url: FULL_URL,
    lastModified: buildDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. 정적 페이지 (12개 언어 x 각 페이지)
  // 주요 언어(en, ko, ja, zh)를 먼저 배치하여 크롤링 우선순위 암시
  const sortedLocales = [
    ...PRIMARY_LOCALES,
    ...SUPPORTED_LOCALES.filter((l) => !PRIMARY_LOCALES.includes(l)),
  ];

  for (const page of STATIC_PAGES) {
    for (const locale of sortedLocales) {
      sitemapEntries.push({
        url: `${FULL_URL}/${locale}${page.path}`,
        lastModified: buildDate,
        changeFrequency: page.changeFrequency,
        priority: getLocalePriority(page.priority, locale),
        alternates: {
          languages: generateAlternates(page.path),
        },
      });
    }
  }

  // 3. 뉴스 상세 페이지 (동적 콘텐츠)
  // 각 언어별로 뉴스 목록을 가져와서 sitemap에 추가
  // 최신 RECENT_NEWS_COUNT개의 뉴스는 높은 priority 부여
  for (const locale of sortedLocales) {
    try {
      const posts = getAllNews(locale);

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const newsPath = `/news/${post.slug}`;

        // 최신 5개 뉴스는 0.7, 나머지는 0.5 (기존 0.6에서 조정)
        const basePriority = i < RECENT_NEWS_COUNT ? 0.7 : 0.5;

        sitemapEntries.push({
          url: `${FULL_URL}/${locale}${newsPath}`,
          lastModified: new Date(post.date),
          changeFrequency: i < RECENT_NEWS_COUNT ? 'weekly' : 'monthly',
          priority: getLocalePriority(basePriority, locale),
          alternates: {
            languages: generateAlternates(newsPath),
          },
        });
      }
    } catch {
      // 해당 언어의 뉴스가 없는 경우 스킵
      console.warn(`No news found for locale: ${locale}`);
    }
  }

  return sitemapEntries;
}
