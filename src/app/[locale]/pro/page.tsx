/**
 * Fan Power Pass 구독 페이지 (Server Component)
 *
 * T2.02: Fan Power Pass 월정액 구독 ($5/월)
 * Buy Me a Coffee 멤버십 결제 연동
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
    title: 'Fan Power Pass - Upgrade Your Voting Power',
    description:
      'Subscribe to Fan Power Pass for 300 daily votes (5x more), power voting, and exclusive features. $5/month or $48/year.',
    alternates: generateAlternates(locale, '/pro'),
  };
}

/** Fan Power Pass 구독 페이지 */
export default async function ProPage({ params }: ProPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProClient />;
}
