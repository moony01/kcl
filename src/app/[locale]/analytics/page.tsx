/**
 * Analytics 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import AnalyticsClient from './AnalyticsClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * Analytics 페이지 Props
 */
interface AnalyticsPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description, OG 태그, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Analytics - Vote Trends & Market Share',
    description:
      'Track K-pop company rankings, vote trends, and market share analysis. See real-time voting statistics and historical data.',
    openGraph: {
      title: 'KCL Analytics - Vote Trends & Market Share',
      description:
        'Track K-pop company rankings, vote trends, and market share analysis. Real-time statistics and insights.',
      url: `https://www.kclhq.com/${locale}/analytics`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KCL Analytics - Vote Trends & Market Share',
      description: 'Track K-pop company rankings and vote trends in real-time.',
    },
    alternates: generateAlternates(locale, '/analytics'),
  };
}

/**
 * Analytics 페이지 (정적 셸)
 */
export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
