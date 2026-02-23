/**
 * KCL Pro 구독 페이지 (Server Component)
 *
 * T2.02: KCL Pro 월정액 구독 ($1.99/월)
 * Lemon Squeezy 결제 연동
 *
 * SSG 빌드 시 정적 셸 생성, 클라이언트에서 동적 데이터 로드
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import ProClient from './ProClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface ProPageProps {
  params: Promise<{ locale: string }>;
}

/** 페이지 메타데이터 */
export async function generateMetadata({ params }: ProPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'KCL Pro - Upgrade Your Voting Power',
    description:
      'Subscribe to KCL Pro for 300 monthly votes (5x more), power voting, and exclusive features. Only $1.99/month.',
    alternates: generateAlternates(locale, '/pro'),
  };
}

/** Pro 구독 페이지 */
export default async function ProPage({ params }: ProPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProClient />;
}
