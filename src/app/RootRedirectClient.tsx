'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/constants';
import { BRAND_TITLE } from '@/lib/brand';

function getPreferredLocale(): SupportedLocale {
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const language of browserLanguages) {
    const shortLanguage = language.split('-')[0].toLowerCase();
    const supportedLocale = SUPPORTED_LOCALES.find((locale) => locale === shortLanguage);

    if (supportedLocale) {
      return supportedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

export default function RootRedirectClient() {
  useEffect(() => {
    window.location.replace(`/${getPreferredLocale()}`);
  }, []);

  return (
    <main
      style={{
        display: 'grid',
        minHeight: '100vh',
        placeItems: 'center',
        padding: '2rem',
        background: '#0a0a0a',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div>
        <h1>{BRAND_TITLE}</h1>
        <p>Redirecting you to the best language for your browser…</p>
        <Link href="/en" style={{ color: '#f5a623' }}>
          Continue in English
        </Link>
      </div>
    </main>
  );
}
