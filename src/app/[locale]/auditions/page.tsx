import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, CalendarSearch, MapPin, Radio } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/common/JsonLd';
import { getAllAuditions, type AuditionMeta } from '@/lib/auditions';
import { FULL_URL, SUPPORTED_LOCALES } from '@/lib/constants';
import { generateAlternates } from '@/lib/seo';
import styles from './page.module.scss';

interface AuditionsPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: AuditionsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Auditions' });

  return {
    title: t('metaTitle'),
    description: t('subtitle'),
    alternates: generateAlternates(locale, '/auditions'),
    openGraph: {
      title: t('metaTitle'),
      description: t('subtitle'),
      url: `${FULL_URL}/${locale}/auditions`,
      type: 'website',
      siteName: 'KCL - K-pop Company League',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('subtitle'),
    },
  };
}

function formatDate(value: string, locale: string, timezone?: string, includeTime = false) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00Z` : value);

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(includeTime && !dateOnly ? { timeStyle: 'short' as const } : {}),
    timeZone: dateOnly ? 'UTC' : timezone,
  }).format(date);
}

function auditionPath(post: AuditionMeta) {
  return `/${post.locale}/auditions/${post.slug}`;
}

export default async function AuditionsPage({ params }: AuditionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'Auditions' });
  const posts = getAllAuditions(locale);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('title'),
    description: t('subtitle'),
    url: `${FULL_URL}/${locale}/auditions`,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${FULL_URL}${auditionPath(post)}`,
      name: post.title,
    })),
  };

  return (
    <main className={styles.container}>
      <JsonLd data={itemListJsonLd} />

      <header className={styles.header}>
        <div className={styles.eyebrow}>{t('eyebrow')}</div>
        <div className={styles.titleWrapper}>
          <CalendarSearch aria-hidden="true" />
          <h1>{t('title')}</h1>
        </div>
        <p>{t('subtitle')}</p>
      </header>

      {posts.length === 0 ? (
        <div className={styles.empty}>{t('noAuditions')}</div>
      ) : (
        <section className={styles.grid} aria-label={t('listLabel')}>
          {posts.map((post) => {
            const isFallback = post.locale !== locale;
            const location = [post.city, post.country].filter(Boolean).join(', ');

            return (
              <article className={styles.card} key={`${post.locale}:${post.slug}`} lang={post.locale}>
                <Link className={styles.posterLink} href={auditionPath(post)}>
                  {/* Official posters are remote assets and remain source-attributed. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.poster}
                    alt={post.posterAlt}
                    width={post.posterWidth}
                    height={post.posterHeight}
                    loading="lazy"
                  />
                  <span className={`${styles.status} ${styles[post.status]}`}>
                    {t(`status_${post.status}`)}
                  </span>
                </Link>

                <div className={styles.cardBody}>
                  <div className={styles.agencyRow}>
                    <span className={styles.agency}>{post.agency}</span>
                    {isFallback && <span className={styles.languageNotice}>{t('englishOnly')}</span>}
                  </div>

                  <h2>
                    <Link href={auditionPath(post)}>{post.title}</Link>
                  </h2>
                  <p className={styles.excerpt}>{post.excerpt}</p>

                  <dl className={styles.facts}>
                    <div>
                      <dt><Radio aria-hidden="true" />{t('mode')}</dt>
                      <dd>{t(`mode_${post.mode}`)}</dd>
                    </div>
                    {post.applicationDeadline ? (
                      <div>
                        <dt><CalendarDays aria-hidden="true" />{t('applicationDeadline')}</dt>
                        <dd>
                          <time dateTime={post.applicationDeadline}>
                            {formatDate(post.applicationDeadline, locale, post.timezone, true)}
                          </time>
                        </dd>
                      </div>
                    ) : (
                      <div>
                        <dt><CalendarDays aria-hidden="true" />{t('applicationDeadline')}</dt>
                        <dd>{t('noFixedDeadline')}</dd>
                      </div>
                    )}
                    {location && (
                      <div>
                        <dt><MapPin aria-hidden="true" />{t('location')}</dt>
                        <dd>{location}</dd>
                      </div>
                    )}
                  </dl>

                  <Link className={styles.readMore} href={auditionPath(post)}>
                    {t('viewDetails')} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <aside className={styles.notice}>
        <strong>{t('noticeTitle')}</strong>
        <p>{t('noticeBody')}</p>
      </aside>
    </main>
  );
}
