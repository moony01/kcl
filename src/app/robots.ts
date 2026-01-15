import { MetadataRoute } from 'next';
import { FULL_URL } from '@/lib/constants';

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
