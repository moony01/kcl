import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { generateAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES, FULL_URL } from '@/lib/constants';
import { BRAND_DESCRIPTION, BRAND_NAME, BRAND_TITLE } from '@/lib/brand';
import { JsonLd } from '@/components/common/JsonLd';
import styles from './page.module.scss';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/** About 페이지 메타데이터 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'About' });

  return {
    title: `${t('title')} | ${BRAND_NAME}`,
    description: BRAND_DESCRIPTION,
    alternates: generateAlternates(locale, '/about'),
  };
}

/** KCL 소개 페이지 - AdSense 검토를 위한 필수 정보 페이지 */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'About' });

  /** JSON-LD 구조화 데이터 - AboutPage 타입으로 Google에 페이지 성격 전달 */
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `${t('title')} | ${BRAND_NAME}`,
    description: BRAND_DESCRIPTION,
    url: `${FULL_URL}/${locale}/about`,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: BRAND_TITLE,
      url: FULL_URL,
    },
  };

  return (
    <>
      <JsonLd data={aboutJsonLd} />
      <main className={styles.aboutPage}>
        <div className={styles.container}>
          {/* 페이지 헤더 */}
          <header className={styles.header}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </header>

          {/* 소개 섹션 */}
          <section className={styles.section}>
            <p className={styles.intro}>{t('intro')}</p>
          </section>

          {/* 작동 방식 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('how_it_works_title')}</h2>
            <ol className={styles.stepList}>
              <li>{t('how_it_works_1')}</li>
              <li>{t('how_it_works_2')}</li>
              <li>{t('how_it_works_3')}</li>
              <li>{t('how_it_works_4')}</li>
            </ol>
          </section>

          {/* 주요 기능 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('features_title')}</h2>
            <div className={styles.featureGrid}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.featureCard}>
                  <h3 className={styles.featureTitle}>{t(`feature_${i}_title`)}</h3>
                  <p className={styles.featureDesc}>{t(`feature_${i}_desc`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 팀 소개 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('team_title')}</h2>
            <p className={styles.text}>{t('team_desc')}</p>
          </section>

          {/* 문의 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('contact_title')}</h2>
            <p className={styles.text}>{t('contact_desc')}</p>
            <p className={styles.contactEmail}>{t('contact_email')}</p>
          </section>

          {/* 면책 조항 */}
          <div className={styles.disclaimerNotice}>
            <p>{t('disclaimer')}</p>
          </div>
        </div>
      </main>
    </>
  );
}
