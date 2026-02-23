/**
 * 비밀번호 재설정 페이지 (Server Component)
 *
 * 이메일의 재설정 링크를 클릭하면 이 페이지로 이동합니다.
 * URL 해시에 포함된 토큰으로 Supabase 세션이 자동 설정되며,
 * 사용자는 새 비밀번호를 입력할 수 있습니다.
 */

import { SUPPORTED_LOCALES } from '@/lib/constants';
import AuthLayout from '@/components/features/auth/AuthLayout';
import ResetPasswordForm from '@/components/features/auth/ResetPasswordForm';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
