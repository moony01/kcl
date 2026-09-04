/**
 * HomePage (리그 시스템)
 *
 * MEARROW 리그 시스템 메인 페이지
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import HomeFeedClient from './HomeFeedClient';
import { generatePageMetadata } from '@/lib/seo';
import { FULL_URL, SUPPORTED_LOCALES } from '@/lib/constants';
import { BRAND_MARK_PATH, BRAND_NAME } from '@/lib/brand';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './seo-content.module.scss';

/** 지원하는 로케일에 대해 페이지 생성 */
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
  const t = await getTranslations({ locale, namespace: 'Home' });

  return generatePageMetadata({
    locale,
    title: t('seo_title'),
    description: t('seo_intro'),
  });
}

/**
 * 홈페이지 (정적 셸 + SEO 콘텐츠)
 * HomeFeedClient가 public profile_posts를 클라이언트에서 데이터 로드
 * 하단에 서버 렌더링 SEO 텍스트 섹션 포함 (AdSense 승인용)
 */
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Home' });
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t('seo_title'),
    url: `${FULL_URL}/${locale}`,
    description: t('seo_intro'),
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${FULL_URL}${BRAND_MARK_PATH}`,
      },
    },
  };

  return (
    <>
      <JsonLd data={websiteJsonLd} />
      <HomeFeedClient />

      {/* SEO 콘텐츠 섹션 - 서버 렌더링, 크롤러에 노출되는 정적 텍스트 */}
      <section className={styles.seoSection}>
        <h1 className={styles.seoTitle}>{t('seo_title')}</h1>
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
