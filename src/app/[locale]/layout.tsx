import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter, Montserrat } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SWRProvider } from '@/components/providers/SWRProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import AppShell from '@/components/layout/AppShell';
import '@/styles/main.scss';
import '@/styles/layout/_app-shell.scss';

/** Google Analytics 측정 ID (Workers 환경변수 우선, 기존 운영 ID fallback) */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-LWCB5XG3S9';

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
import { FULL_URL, ADSENSE_PUBLISHER_ID } from '@/lib/constants';
import {
  BRAND_DESCRIPTION,
  BRAND_MARK_PATH,
  BRAND_NAME,
  BRAND_THEME_COLOR,
  BRAND_TITLE,
} from '@/lib/brand';

/**
 * Next.js 14+에서 viewport는 별도로 export해야 함
 * viewport 메타태그 설정: 모바일 최적화
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: BRAND_THEME_COLOR,
};

/**
 * 페이지 메타데이터 설정
 * SEO 최적화 및 소셜 미디어 공유 정보
 */
export const metadata: Metadata = {
  metadataBase: new URL(FULL_URL),
  title: {
    template: `%s | ${BRAND_NAME}`,
    default: BRAND_TITLE,
  },
  description: BRAND_DESCRIPTION,
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    type: 'website',
    url: FULL_URL,
    // images는 opengraph-image.tsx에서 동적 생성됨
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    // images는 opengraph-image.tsx에서 동적 생성됨
  },
  icons: {
    icon: [{ url: BRAND_MARK_PATH, type: 'image/svg+xml' }],
    shortcut: BRAND_MARK_PATH,
    apple: [{ url: BRAND_MARK_PATH, type: 'image/svg+xml' }],
  },
};

const locales = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'];

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
      <head>
        {/* React Grab — dev only */}
        {process.env.NODE_ENV === 'development' && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {/* Google AdSense 계정 인증 메타 태그 */}
        <meta name="google-adsense-account" content={ADSENSE_PUBLISHER_ID} />
      </head>
      <body className={`${inter.variable} ${montserrat.variable}`}>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
        </Script>
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SWRProvider>
            <NextIntlClientProvider messages={messages}>
              <AuthProvider>
                <AppShell>{children}</AppShell>
              </AuthProvider>
            </NextIntlClientProvider>
          </SWRProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
