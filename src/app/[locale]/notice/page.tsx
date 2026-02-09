import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import NoticeClient from './NoticeClient';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** 공지사항 페이지 메타데이터 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Notice' });

  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: generateAlternates(locale, '/notice'),
  };
}

/**
 * 공지사항 페이지
 * SSG 셸 + CSR 클라이언트 컴포넌트 조합
 * Supabase 데이터는 클라이언트에서 페칭
 */
export default async function NoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <h1 className="sr-only">KCL Notices</h1>
      <NoticeClient locale={locale} />
    </>
  );
}
