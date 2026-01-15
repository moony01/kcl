import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Montserrat } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import AppShell from '@/components/layout/AppShell';
import '@/styles/main.scss';
import '@/styles/layout/_app-shell.scss';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

import { Metadata, Viewport } from 'next';
import { FULL_URL, BASE_PATH } from '@/lib/constants';

/**
 * Next.js 14+에서 viewport는 별도로 export해야 함
 * viewport 메타태그 설정: 모바일 최적화
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#8B5CF6',
};

/**
 * 페이지 메타데이터 설정
 * SEO 최적화 및 소셜 미디어 공유 정보
 */
export const metadata: Metadata = {
  metadataBase: new URL(FULL_URL),
  title: {
    template: '%s | KCL',
    default: 'KCL - Kpop Company League',
  },
  description: "Prove your fandom's firepower. Support your artist in the global ranking battle.",
  openGraph: {
    title: 'KCL - Kpop Company League',
    description: "Prove your fandom's firepower. Support your artist in the global ranking battle.",
    siteName: 'Kpop Company League',
    type: 'website',
    url: FULL_URL,
    images: [
      {
        url: `${BASE_PATH}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'KCL - Kpop Company League',
      },
    ],
  },
};

const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params properly in Next.js 15+ equivalent behavior
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client side
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <AppShell>
              {children}
            </AppShell>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
