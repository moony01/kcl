import AuthLayout from '@/components/features/auth/AuthLayout';
import SignupForm from '@/components/features/auth/SignupForm';
import Link from 'next/link';

export function generateStaticParams() {
  const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];
  return locales.map((locale) => ({ locale }));
}

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
