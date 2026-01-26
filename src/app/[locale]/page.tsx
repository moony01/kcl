/**
 * HomePage (리그 시스템)
 *
 * KCL 리그 시스템 메인 페이지
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import { HomeClient } from './HomeClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

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
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: generateAlternates(locale, ''),
  };
}

/**
 * 홈페이지 (정적 셸)
 * 서버에서 데이터를 fetching하지 않음
 * HomeClient가 SWR로 클라이언트에서 데이터 로드
 */
export default function HomePage() {
  return <HomeClient />;
}
