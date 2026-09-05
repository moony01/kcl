import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import RankingClient from './RankingClient';
import { generatePageMetadata } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { BRAND_NAME } from '@/lib/brand';
import styles from './ranking-page.module.scss';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface RankingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: RankingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Nav' });
  const tHome = await getTranslations({ locale, namespace: 'Home' });
  return generatePageMetadata({
    locale,
    pathname: '/ranking',
    title: `${t('ranking')} | ${BRAND_NAME}`,
    description: tHome('seo_intro'),
  });
}

export default async function RankingPage({ params }: RankingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations({ locale, namespace: 'Nav' });
  const tHome = await getTranslations({ locale, namespace: 'Home' });

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{BRAND_NAME}</p>
        <h1 className={styles.title}>{tNav('ranking')}</h1>
        <p className={styles.subtitle}>{tHome('title')}</p>
      </header>
      <RankingClient />
    </section>
  );
}
