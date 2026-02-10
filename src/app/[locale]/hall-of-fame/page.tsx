/**
 * Hall of Fame 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 + SEO 콘텐츠 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 * @updated AdSense - SEO 콘텐츠 섹션 추가 (thin content 해소)
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HallOfFameClient from './HallOfFameClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './hall-of-fame-seo.module.scss';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * Hall of Fame 페이지 Props
 */
interface HallOfFamePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description, OG 태그, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: HallOfFamePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Hall of Fame - K-pop Champions',
    description:
      'See the legendary champions who topped the K-pop Company League. Hall of fame featuring all-time winners and their achievements.',
    openGraph: {
      title: 'KCL Hall of Fame - K-pop Champions',
      description:
        'See the legendary champions who topped the K-pop Company League. All-time winners and achievements.',
      url: `https://www.kclhq.com/${locale}/hall-of-fame`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KCL Hall of Fame - K-pop Champions',
      description: 'The legendary champions of the K-pop Company League.',
    },
    alternates: generateAlternates(locale, '/hall-of-fame'),
  };
}

/** Hall of Fame ItemList JSON-LD 스키마 */
const hallOfFameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'KCL Hall of Fame',
  description: 'K-pop company champions history - legendary winners of the K-pop Company League',
  url: 'https://www.kclhq.com/hall-of-fame',
};

/**
 * 명예의 전당 페이지 (정적 셸 + SEO 콘텐츠)
 * 상단 설명 + CSR 챔피언 데이터 + 하단 SEO 텍스트
 */
export default async function HallOfFamePage({ params }: HallOfFamePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'HallOfFame' });

  return (
    <>
      <JsonLd data={hallOfFameJsonLd} />

      {/* SEO 헤더 섹션 - 서버 렌더링 */}
      <header className={styles.seoHeader}>
        <h1 className={styles.seoHeaderTitle}>{t('seo_title')}</h1>
        <div className={styles.seoDivider} />
        <p className={styles.seoHeaderSubtitle}>{t('seo_subtitle')}</p>
      </header>

      {/* CSR 챔피언 데이터 영역 */}
      <HallOfFameClient />

      {/* SEO 콘텐츠 하단 섹션 */}
      <section className={styles.seoSection}>
        <div className={styles.seoGrid}>
          <div className={styles.seoCard}>
            <h2>{t('seo_how_title')}</h2>
            <p>{t('seo_how_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h2>{t('seo_history_title')}</h2>
            <p>{t('seo_history_desc')}</p>
          </div>
        </div>
        <div className={styles.seoFullCard}>
          <h2>{t('seo_legacy_title')}</h2>
          <p>{t('seo_legacy_desc')}</p>
        </div>
        <div className={styles.seoFullCard}>
          <h2>{t('seo_system_title')}</h2>
          <p>{t('seo_system_desc')}</p>
        </div>
      </section>
    </>
  );
}
