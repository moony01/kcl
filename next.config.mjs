import path from 'path';
import { fileURLToPath } from 'url';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === 'development';

/**
 * KCL은 Cloudflare Workers에서 OpenNext 어댑터로 실행됩니다.
 * 공개 콘텐츠는 Next의 캐시/정적 렌더링을 활용하고, 인증·개인화 화면은
 * 요청 시 렌더링할 수 있도록 output: export를 사용하지 않습니다.
 */
const nextConfig = {
  images: {
    // Worker 런타임에서 별도 Sharp 서버를 요구하지 않도록 원본/Cloudflare CDN을 사용합니다.
    // 추후 Cloudflare Images binding을 붙일 때 이 옵션을 제거할 수 있습니다.
    unoptimized: true,
    imageSizes: [400],
    deviceSizes: [800],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  reactCompiler: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: __dirname,
  },
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'src/styles'),
      path.join(__dirname, 'src/styles/abstracts'),
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://t1.kakaocdn.net https://*.googlesyndication.com https://*.google.com https://*.googleadservices.com https://*.doubleclick.net https://*.adtrafficquality.google https://fundingchoicesmessages.google.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://kapi.kakao.com https://sharer.kakao.com; frame-src https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com https://fundingchoicesmessages.google.com https://*.adtrafficquality.google; frame-ancestors https://moony01.com https://www.moony01.com`,
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
