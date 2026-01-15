import AuthLayout from '@/components/features/auth/AuthLayout';
import SignupForm from '@/components/features/auth/SignupForm';
import Link from 'next/link';

/**
 * 회원가입 페이지 - 동적 렌더링
 * Phase 1에서는 회원가입 기능이 비활성화되어 있습니다.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function SignupPage() {
  const footerLink = (
    <>
      계정이 있으신가요? <Link href="/login">로그인</Link>
    </>
  );

  return (
    <AuthLayout footerLink={footerLink}>
      <SignupForm />
    </AuthLayout>
  );
}
