import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import CommunityRedirect from './CommunityRedirect';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** 커뮤니티 → 공지사항 리다이렉트 메타데이터 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * 커뮤니티 페이지 → 공지사항으로 리다이렉트
 * 기존 커뮤니티 URL 방문 시 공지사항 페이지로 자동 이동
 */
export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CommunityRedirect locale={locale} />;
}
