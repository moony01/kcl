/**
 * 커뮤니티 목록 페이지 (Server Component)
 *
 * SSG 정적 셸 생성 후 CommunityClient에서 CSR로 데이터 fetch
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션 (Supabase 연동)
 */

import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import CommunityClient from './CommunityClient';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * 커뮤니티 목록 페이지 Props
 */
interface CommunityPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description, OG 태그, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Community' });

  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: 'KCL Community - K-pop Fan Free Board',
      description:
        'Join the K-pop fan community. Share your thoughts, discuss with fellow fans, and connect with the global K-pop fandom.',
      url: `https://www.kclhq.com/${locale}/community`,
      type: 'website',
      images: ['/images/og/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KCL Community - K-pop Fan Free Board',
      description: 'Join the K-pop fan community and connect with fans worldwide.',
    },
    alternates: generateAlternates(locale, '/community'),
  };
}

/** Community DiscussionForumPosting JSON-LD 스키마 */
const communityJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DiscussionForumPosting',
  headline: 'KCL Community - K-pop Fan Free Board',
  description: 'Join the K-pop fan community. Share your thoughts and connect with fans worldwide.',
  url: 'https://www.kclhq.com/community',
  publisher: {
    '@type': 'Organization',
    name: 'KCL',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.kclhq.com/images/logo.png',
    },
  },
};

/**
 * 커뮤니티 목록 페이지
 * Server Component 셸 + Client Component 조합
 */
export default async function CommunityPage({ params }: CommunityPageProps) {
  const { locale } = await params;

  // next-intl 정적 생성 지원
  setRequestLocale(locale);

  return (
    <>
      <JsonLd data={communityJsonLd} />
      {/* SEO용 h1 태그 - 시각적으로 숨김 처리하여 스크린 리더와 검색 엔진에만 노출 */}
      <h1 className="sr-only">KCL Community - K-pop Fan Free Board</h1>
      <CommunityClient locale={locale} />
    </>
  );
}
