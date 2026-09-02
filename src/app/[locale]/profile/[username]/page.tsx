import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PublicProfileClient from '@/components/features/profile/PublicProfileClient';
import { BRAND_NAME } from '@/lib/brand';
import { generateDynamicAlternates } from '@/lib/seo';

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

  return {
    title: username + ' | ' + BRAND_NAME,
    description: username + ' ' + BRAND_NAME + ' ' + '공개 프로필',
    alternates: generateDynamicAlternates(
      locale,
      '/profile',
      encodeURIComponent(username),
    ),
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { locale, username: rawUsername } = await params;
  setRequestLocale(locale);

  return (
    <PublicProfileClient
      locale={locale}
      username={decodeUsername(rawUsername)}
    />
  );
}
