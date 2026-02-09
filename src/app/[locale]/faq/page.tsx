import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES, FULL_URL } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import FaqClient from './FaqClient';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** FAQ 페이지 메타데이터 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'FAQ' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    alternates: generateAlternates(locale, '/faq'),
  };
}

/**
 * FAQ 페이지 - Google 리치 결과(FAQPage) 지원
 * JSON-LD FAQPage 스키마로 검색 결과에 FAQ 드롭다운 노출
 */
export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'FAQ' });

  /** FAQ 항목 목록 (서버에서 생성하여 클라이언트로 전달) */
  const faqItems = Array.from({ length: 9 }, (_, i) => ({
    question: t(`q${i + 1}`),
    answer: t(`a${i + 1}`),
  }));

  /**
   * JSON-LD FAQPage 구조화 데이터
   * Google 검색 결과에 FAQ 리치 스니펫으로 노출됨 (SEO에 매우 유리)
   * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
   */
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <FaqClient
        title={t('title')}
        subtitle={t('subtitle')}
        items={faqItems}
      />
    </>
  );
}
