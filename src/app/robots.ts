import { MetadataRoute } from 'next';
import { FULL_URL } from '@/lib/constants';

/**
 * SSG 모드에서 정적 robots.txt 생성
 *
 * output: 'export' 모드에서는 dynamic = 'force-static' 필수
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/_next/'],
    },
    sitemap: `${FULL_URL}/sitemap.xml`,
  };
}
