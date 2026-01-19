/**
 * 로그인 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import AuthLayout from '@/components/features/auth/AuthLayout';
import LoginForm from '@/components/features/auth/LoginForm';
import Link from 'next/link';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <AuthLayout
      footerLink={
        <>
          계정이 없으신가요? <Link href="/signup">가입하기</Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
