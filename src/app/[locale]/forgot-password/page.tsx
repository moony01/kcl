/**
 * 비밀번호 찾기 페이지 (Server Component)
 *
 * 이메일을 입력하면 비밀번호 재설정 링크를 발송합니다.
 * AuthLayout으로 일관된 인증 UI를 제공합니다.
 */

import { Metadata } from 'next';
import AuthLayout from '@/components/features/auth/AuthLayout';
import ForgotPasswordForm from '@/components/features/auth/ForgotPasswordForm';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface ForgotPasswordPageProps {
  params: Promise<{ locale: string }>;
}

/** 페이지 메타데이터 생성 */
export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Forgot Password',
    robots: { index: false, follow: false },
    alternates: generateAlternates(locale, '/forgot-password'),
  };
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
