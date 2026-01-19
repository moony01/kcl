import { MetadataRoute } from 'next';
import { FULL_URL } from '@/lib/constants';
import { getAllNews } from '@/lib/news';

/**
 * SSG 모드에서 정적 사이트맵 생성
 *
 * output: 'export' 모드에서는 dynamic = 'force-static' 필수
 * 빌드 시점에 사이트맵이 생성되며, 런타임에 변경되지 않습니다.
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  // 지원 언어 목록
  const locales = ['ko', 'en'];

  // 빌드 시점의 날짜 (정적)
  const buildDate = new Date();

  // 정적 페이지 URL
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: FULL_URL,
      lastModified: buildDate,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${FULL_URL}/en/ranking`,
      lastModified: buildDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${FULL_URL}/ko/ranking`,
      lastModified: buildDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // 뉴스 목록 페이지 URL
  const newsListPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${FULL_URL}/${locale}/news`,
    lastModified: buildDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 뉴스 상세 페이지 URL (빌드 시점에 정적 생성)
  const newsDetailPages: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    const posts = getAllNews(locale);
    for (const post of posts) {
      newsDetailPages.push({
        url: `${FULL_URL}/${locale}/news/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...newsListPages, ...newsDetailPages];
}
