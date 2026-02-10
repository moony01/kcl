/**
 * Analytics 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 + SEO 콘텐츠 생성, 데이터는 CSR로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 * @updated AdSense - SEO 콘텐츠 섹션 추가 (thin content 해소)
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AnalyticsClient from './AnalyticsClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './analytics-seo.module.scss';

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

/** Analytics 페이지 JSON-LD */
const analyticsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'KCL Analytics - Vote Trends & Market Share',
  description: 'Real-time K-pop company voting analytics, market share analysis, and trend tracking.',
  url: 'https://www.kclhq.com/analytics',
};

/**
 * Analytics 페이지 (정적 셸 + SEO 콘텐츠)
 * 상단에 서버 렌더링 설명 텍스트 + 하단에 CSR 차트/데이터
 */
export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Analytics' });

  return (
    <>
      <JsonLd data={analyticsJsonLd} />

      {/* SEO 인트로 섹션 - 서버 렌더링 (AnalyticsClient가 자체 h1 보유) */}
      <div className={styles.seoHeader}>
        <p className={styles.seoHeaderSubtitle}>{t('seo_intro')}</p>
      </div>

      {/* CSR 차트/데이터 영역 */}
      <AnalyticsClient />

      {/* SEO 콘텐츠 하단 섹션 */}
      <section className={styles.seoSection}>
        <div className={styles.seoGrid}>
          <div className={styles.seoCard}>
            <h2>{t('seo_trends_title')}</h2>
            <p>{t('seo_trends_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_market_title')}</h2>
            <p>{t('seo_market_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_insights_title')}</h2>
            <p>{t('seo_insights_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_discover_title')}</h2>
            <p>{t('seo_discover_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_realtime_title')}</h2>
            <p>{t('seo_realtime_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_compare_title')}</h2>
            <p>{t('seo_compare_desc')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
