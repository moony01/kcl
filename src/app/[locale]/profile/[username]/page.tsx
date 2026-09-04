import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PublicProfileClient from '@/components/features/profile/PublicProfileClient';
import { BRAND_NAME } from '@/lib/brand';
import { FULL_URL } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import { generatePageMetadata } from '@/lib/seo';

interface PublicProfilePageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

/**
 * Public profiles are loaded from Supabase in the client. Workers handles
 * arbitrary usernames at request time; the empty list keeps the legacy static
 * export from trying to enumerate database users at build time.
 */
export function generateStaticParams() {
  return [];
}

function decodeUsername(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { locale, username: rawUsername } = await params;
  const username = decodeUsername(rawUsername);
  const t = await getTranslations({ locale, namespace: 'PublicProfile' });

  return generatePageMetadata({
    locale,
    pathname: `/profile/${encodeURIComponent(username)}`,
    title: `${username} | ${t('title_suffix')} | ${BRAND_NAME}`,
    description: `${t('public')}: ${username}. ${t('posts')}. ${t('activities')}.`,
  });
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { locale, username: rawUsername } = await params;
  setRequestLocale(locale);
  const username = decodeUsername(rawUsername);
  const profileJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${username} | ${BRAND_NAME}`,
    url: `${FULL_URL}/${locale}/profile/${encodeURIComponent(username)}`,
    inLanguage: locale,
    isPartOf: { '@type': 'WebSite', name: BRAND_NAME, url: FULL_URL },
  };

  return (
    <>
      <JsonLd data={profileJsonLd} />
      <PublicProfileClient locale={locale} username={username} />
    </>
  );
}
