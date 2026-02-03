/**
 * Hall of Fame 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { Metadata } from 'next';
import HallOfFameClient from './HallOfFameClient';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * Hall of Fame 페이지 Props
 */
interface HallOfFamePageProps {
  params: Promise<{ locale: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description, OG 태그, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: HallOfFamePageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Hall of Fame - K-pop Champions',
    description:
      'See the legendary champions who topped the K-pop Company League. Hall of fame featuring all-time winners and their achievements.',
    openGraph: {
      title: 'KCL Hall of Fame - K-pop Champions',
      description:
        'See the legendary champions who topped the K-pop Company League. All-time winners and achievements.',
      url: `https://www.kclhq.com/${locale}/hall-of-fame`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'KCL Hall of Fame - K-pop Champions',
      description: 'The legendary champions of the K-pop Company League.',
    },
    alternates: generateAlternates(locale, '/hall-of-fame'),
  };
}

/** Hall of Fame ItemList JSON-LD 스키마 */
const hallOfFameJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'KCL Hall of Fame',
  description: 'K-pop company champions history - legendary winners of the K-pop Company League',
  url: 'https://www.kclhq.com/hall-of-fame',
};

/**
 * 명예의 전당 페이지 (정적 셸)
 */
export default function HallOfFamePage() {
  return (
    <>
      <JsonLd data={hallOfFameJsonLd} />
      {/* SEO용 h1 태그 - 시각적으로 숨김 처리하여 스크린 리더와 검색 엔진에만 노출 */}
      <h1 className="sr-only">Hall of Fame - K-pop Champions</h1>
      <HallOfFameClient />
    </>
  );
}
