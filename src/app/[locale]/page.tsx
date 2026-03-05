/**
 * HomePage (리그 시스템)
 *
 * KCL 리그 시스템 메인 페이지
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HomeClient } from './HomeClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './seo-content.module.scss';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * 홈페이지 Props
 */
interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description, OG 태그, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'KCL - K-pop Company League',
    description:
      "Prove your fandom's power! Vote and rank your favorite K-pop companies in the ultimate fan showdown.",
    openGraph: {
      title: 'KCL - K-pop Company League',
      description:
        "Prove your fandom's power! Vote and rank your favorite K-pop companies in the ultimate fan showdown.",
      url: `https://www.kclhq.com/${locale}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KCL - K-pop Company League',
      description: "Prove your fandom's power! Vote for your favorite K-pop company.",
    },
    alternates: generateAlternates(locale, ''),
  };
}

/** WebSite + Organization JSON-LD 스키마 */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KCL - K-pop Company League',
  url: 'https://www.kclhq.com',
  description: 'Vote and rank K-pop entertainment companies',
  publisher: {
    '@type': 'Organization',
    name: 'KCL',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.kclhq.com/images/logo.png',
    },
  },
};

/**
 * 홈페이지 (정적 셸 + SEO 콘텐츠)
 * HomeClient가 SWR로 클라이언트에서 데이터 로드
 * 하단에 서버 렌더링 SEO 텍스트 섹션 포함 (AdSense 승인용)
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <HomeClient />

      {/* SEO 콘텐츠 섹션 - 서버 렌더링, 크롤러에 노출되는 정적 텍스트 */}
      <section className={styles.seoSection}>
        <h2 className={styles.seoTitle}>{t('seo_title')}</h2>
        <p className={styles.seoIntro}>{t('seo_intro')}</p>

        <div className={styles.seoGrid}>
          <div className={styles.seoCard}>
            <h3>{t('seo_how_title')}</h3>
            <p>{t('seo_how_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h3>{t('seo_vote_title')}</h3>
            <p>{t('seo_vote_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h3>{t('seo_season_title')}</h3>
            <p>{t('seo_season_desc')}</p>
          </div>
          <div className={styles.seoCard}>
            <h3>{t('seo_global_title')}</h3>
            <p>{t('seo_global_desc')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
