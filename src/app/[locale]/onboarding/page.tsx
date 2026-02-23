import type { Metadata } from 'next';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import OnboardingClient from './OnboardingClient';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface OnboardingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OnboardingPageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === 'ko' ? '최애 그룹 설정' : 'Favorite Group Setup',
  };
}

export default function OnboardingPage() {
  return <OnboardingClient />;
}
