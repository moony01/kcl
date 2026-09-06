/**
 * 로그인 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import AuthLayout from '@/components/features/auth/AuthLayout';
import LoginForm from '@/components/features/auth/LoginForm';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * 로그인 페이지 Props
 */
interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Login',
    robots: { index: false, follow: false },
    alternates: generateAlternates(locale, '/login'),
  };
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
