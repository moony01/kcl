/**
 * Hall of Fame 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸을 생성하고 데이터는 CSR로 로드합니다.
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 * 화면에는 기록 확인에 필요한 제목과 설명만 노출합니다.
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HallOfFameClient from './HallOfFameClient';
import { generateAlternates } from '@/lib/seo';
import { FULL_URL, SUPPORTED_LOCALES } from '@/lib/constants';
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/brand';
import { JsonLd } from '@/components/common/JsonLd';
import AdBanner from '@/components/common/AdBanner';
import { AD_SLOTS } from '@/types/ads';
import styles from './hall-of-fame-seo.module.scss';

/** 지원하는 언어에 대해 정적 페이지 생성 */
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
    title: `${BRAND_NAME} Hall of Fame`,
    description: BRAND_DESCRIPTION,
    openGraph: {
      title: `${BRAND_NAME} Hall of Fame`,
      description: BRAND_DESCRIPTION,
      url: `${FULL_URL}/${locale}/hall-of-fame`,
      type: 'website',
      siteName: BRAND_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${BRAND_NAME} Hall of Fame`,
      description: BRAND_DESCRIPTION,
    },
    alternates: generateAlternates(locale, '/hall-of-fame'),
  };
}

/**
 * 명예의 전당 페이지 (정적 셸 + CSR 챔피언 데이터)
 */
export default async function HallOfFamePage({ params }: HallOfFamePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'HallOfFame' });
  const hallOfFameJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${BRAND_NAME} Hall of Fame`,
    description: BRAND_DESCRIPTION,
    url: `${FULL_URL}/${locale}/hall-of-fame`,
  };

  return (
    <>
      <JsonLd data={hallOfFameJsonLd} />

      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.description}>{t('meta_description')}</p>
      </header>

      {/* CSR 챔피언 데이터 영역 */}
      <HallOfFameClient />

      {/* 명예의 전당 하단 광고 */}
      <AdBanner adSlot={AD_SLOTS.HOF_BOTTOM} adFormat="leaderboard" />

    </>
  );
}
