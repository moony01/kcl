import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { getPublishedAnnouncementIds } from '@/lib/api/announcements';
import NoticeDetailClient from './NoticeDetailClient';

/**
 * 정적 경로 생성
 * 12개 언어 × 모든 공지사항 ID 조합
 * 빌드 타임에 Supabase에서 공개된 공지사항 ID를 조회
 */
export async function generateStaticParams() {
  const ids = await getPublishedAnnouncementIds();

  return SUPPORTED_LOCALES.flatMap((locale) =>
    ids.map((id) => ({ locale, id })),
  );
}

/** 공지사항 상세 페이지 Props */
interface NoticeDetailPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

/** 공지사항 상세 페이지 메타데이터 */
export async function generateMetadata({ params }: NoticeDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Notice' });

  return {
    title: `${t('title')} | KCL`,
    description: t('subtitle'),
    alternates: generateDynamicAlternates(locale, '/notice', (await params).id),
  };
}

/**
 * 공지사항 상세 페이지
 * SSG 셸 + CSR 클라이언트 컴포넌트 조합
 * Supabase 데이터는 클라이언트에서 페칭
 */
export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <NoticeDetailClient locale={locale} noticeId={id} />;
}
