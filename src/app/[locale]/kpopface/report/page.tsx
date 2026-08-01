import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import ReportClient from './ReportClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

// The report page reads account state in the browser, but must be served by the
// Workers runtime so auth/session-aware navigation is not constrained by export.
export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface ReportPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isKorean = locale === 'ko';

  return {
    title: isKorean ? 'Kpopface AI 리포트' : 'Kpopface AI Report',
    description: isKorean
      ? 'KCL에서 사진을 다시 업로드하고 AI 스타일 리포트를 받아보세요.'
      : 'Upload your photo again on KCL and receive an AI visual-style report.',
    alternates: generateAlternates(locale, '/kpopface/report'),
  };
}

export default async function KpopfaceReportPage({ params }: ReportPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ReportClient locale={locale} />;
}
