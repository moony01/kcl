/**
 * Company Detail Page (Server Component)
 *
 * 소속사 상세 페이지 - SSG 정적 셸 + CSR 데이터 로드
 *
 * @note 동적 라우트 [id]는 알려진 회사 slug로 정적 생성
 * @note Feature Flag로 비활성화 시 홈으로 리다이렉트
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { use } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FEATURES } from '@/config/features';
import CompanyDetailClient from './CompanyDetailClient';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './company-seo.module.scss';

/** 알려진 회사 slug 목록 (정적 생성 대상) */
const knownCompanySlugs = [
  'hybe',
  'sm',
  'jyp',
  'yg',
  'starship',
  'cube',
  'fnc',
  'pledis',
  'rbw',
  'woollim',
  'kakao',
  'cj-enm',
];

/**
 * 정적 경로 생성
 * 12개 언어 × 알려진 회사 slug 조합
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => knownCompanySlugs.map((id) => ({ locale, id })));
}

/**
 * Company Detail 페이지 Props
 */
interface CompanyDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: CompanyDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const companyName = id.toUpperCase();

  return {
    title: `${companyName} | KCL`,
    description: `View ${companyName}'s profile, real-time voting statistics, artist roster, and rankings on KCL (K-pop Company League).`,
    alternates: generateDynamicAlternates(locale, '/company', id),
  };
}

/**
 * Company Detail 페이지 (정적 셸 + SEO 콘텐츠)
 * 서버에서 회사명 기반 SEO 텍스트 렌더링 + CSR로 상세 데이터 로드
 */
export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  const { locale, id } = use(params);

  if (!FEATURES.COMPANY_DETAIL_PAGE) {
    redirect(`/${locale}`);
  }

  setRequestLocale(locale);

  const companyName = id.toUpperCase();

  /** Company JSON-LD 구조화 데이터 */
  const companyJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: companyName,
    url: `https://www.kclhq.com/${locale}/company/${id}`,
    description: `${companyName} K-pop entertainment company profile on KCL`,
  };

  return (
    <>
      <JsonLd data={companyJsonLd} />
      <CompanyDetailClient locale={locale} id={id} />

      {/* SEO 콘텐츠 하단 섹션 - 서버 렌더링 */}
      <CompanySeoSection locale={locale} companyName={companyName} />
    </>
  );
}

/** 회사 상세 페이지 SEO 섹션 (서버 컴포넌트) */
async function CompanySeoSection({ locale, companyName }: { locale: string; companyName: string }) {
  const t = await getTranslations({ locale, namespace: 'Company' });

  return (
    <section className={styles.seoSection}>
      <h2 className={styles.seoTitle}>{t('seo_title', { company: companyName })}</h2>
      <p className={styles.seoIntro}>{t('seo_intro', { company: companyName })}</p>

      <div className={styles.seoGrid}>
        <div className={styles.seoCard}>
          <h3>{t('seo_vote_title', { company: companyName })}</h3>
          <p>{t('seo_vote_desc', { company: companyName })}</p>
        </div>
        <div className={styles.seoCard}>
          <h3>{t('seo_stats_title')}</h3>
          <p>{t('seo_stats_desc', { company: companyName })}</p>
        </div>
      </div>
    </section>
  );
}
