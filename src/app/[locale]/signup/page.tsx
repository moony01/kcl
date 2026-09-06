/**
 * 회원가입 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import AuthLayout from '@/components/features/auth/AuthLayout';
import SignupForm from '@/components/features/auth/SignupForm';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * 회원가입 페이지 Props
 */
interface SignupPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: SignupPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Sign Up',
    robots: { index: false, follow: false },
    alternates: generateAlternates(locale, '/signup'),
  };
}

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
