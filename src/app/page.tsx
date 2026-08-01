import type { Metadata } from 'next';
import RootRedirectClient from './RootRedirectClient';
import { FULL_URL, SUPPORTED_LOCALES } from '@/lib/constants';

const ROOT_TITLE = 'KCL - K-pop Company League';
const ROOT_DESCRIPTION =
  'Vote and rank your favorite K-pop entertainment companies in the global K-pop Company League.';

const rootLanguages: Record<string, string> = Object.fromEntries(
  SUPPORTED_LOCALES.map((locale) => [locale, `${FULL_URL}/${locale}`]),
);
rootLanguages['x-default'] = `${FULL_URL}/en`;

/**
 * The root URL is a locale selector, not an indexable content page.
 * Keep it accessible with a crawlable fallback while making locale pages canonical.
 */
export const metadata: Metadata = {
  metadataBase: new URL(FULL_URL),
  title: ROOT_TITLE,
  description: ROOT_DESCRIPTION,
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${FULL_URL}/en`,
    languages: rootLanguages,
  },
};

export default function RootPage() {
  return <RootRedirectClient />;
}
