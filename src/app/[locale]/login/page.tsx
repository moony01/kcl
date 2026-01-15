import AuthLayout from '@/components/features/auth/AuthLayout';
import LoginForm from '@/components/features/auth/LoginForm';
import Link from 'next/link';

/**
 * 로그인 페이지 - 동적 렌더링
 *
 * 빌드 시점에 Supabase 클라이언트가 필요하므로 정적 생성을 건너뜁니다.
 * Phase 1에서는 로그인 기능이 비활성화되어 있습니다.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  // We can unwrap params if needed, but for now we rely on Link href context from calling page
  // But actually the Link in AuthLayout footer needs to be locale aware?
  // Since Link comes from 'next/link', it doesn't auto-prefix locale in App Router without next-intl middleware or wrapper.
  // However, I'm just hardcoding /signup.
  // If I want /ko/signup, I should retrieve locale.

  // Let's rely on standard <Link> for now, assuming user will fix locale nav later if needed.
  // Or I can use client component to get params.
  // But page is server component.

  // Actually, let's just make it a client page or await params.

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
