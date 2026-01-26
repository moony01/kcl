/**
 * Profile Page (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import ProfileLayout from '@/components/features/profile';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * Profile 페이지 Props
 */
interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Profile',
    alternates: generateAlternates(locale, '/profile'),
  };
}

/**
 * 프로필 페이지 (정적 셸)
 */
export default function ProfilePage() {
  return <ProfileLayout />;
}
