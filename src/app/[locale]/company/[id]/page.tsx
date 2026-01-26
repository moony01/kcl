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
import { setRequestLocale } from 'next-intl/server';
import { FEATURES } from '@/config/features';
import CompanyDetailClient from './CompanyDetailClient';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

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

  return {
    title: `${id.toUpperCase()} | KCL`,
    alternates: generateDynamicAlternates(locale, '/company', id),
  };
}

export default function CompanyDetailPage({ params }: CompanyDetailPageProps) {
  // Next.js 15+ params 비동기 처리
  const { locale, id } = use(params);

  // Feature Flag 체크: 비활성화 시 홈으로 리다이렉트
  if (!FEATURES.COMPANY_DETAIL_PAGE) {
    redirect(`/${locale}`);
  }

  // Enable static rendering for locale
  setRequestLocale(locale);

  // 클라이언트 컴포넌트에서 데이터 로딩 처리
  // (SWR을 통한 클라이언트 사이드 데이터 페칭)
  return <CompanyDetailClient locale={locale} id={id} />;
}
