import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isGithubPages = process.env.DEPLOY_TARGET === 'gh-pages';

const nextConfig = {
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? '/plolux/kcl' : undefined,
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'src/styles'),
      path.join(__dirname, 'src/styles/abstracts'),
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? '/plolux/kcl' : '',
  },
  /**
   * 보안 헤더 설정
   * - X-Frame-Options: 클릭재킹 방지
   * - X-Content-Type-Options: MIME 타입 스니핑 방지
   * - Referrer-Policy: 리퍼러 정보 제한
   * - X-XSS-Protection: 레거시 XSS 필터 활성화
   * - Permissions-Policy: 민감한 브라우저 기능 제한
   */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
