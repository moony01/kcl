import { MetadataRoute } from 'next';
import { FULL_URL } from '@/lib/constants';
import { getAllNews } from '@/lib/news';

/**
 * 사이트맵 생성
 * 정적 페이지 + 동적 뉴스 페이지 URL 포함
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // 지원 언어 목록
  const locales = ['ko', 'en'];

  // 정적 페이지 URL
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: FULL_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${FULL_URL}/en/ranking`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${FULL_URL}/ko/ranking`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // 뉴스 목록 페이지 URL
  const newsListPages: MetadataRoute.Sitemap = locales.map((locale) => ({
    url: `${FULL_URL}/${locale}/news`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // 뉴스 상세 페이지 URL (동적 생성)
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
