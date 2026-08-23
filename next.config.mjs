import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';
const isWorkers = process.env.NEXT_RUNTIME_TARGET === 'workers';
const useStaticExport = !isDev && !isWorkers;

/**
 * Next.js 설정
 *
 * SSG/CSR 마이그레이션 완료:
 * - Phase 1-2: Supabase 클라이언트 + API 레이어 (Kai) ✅
 * - Phase 3: API Routes/Redis 제거 (Max) ✅
 * - Phase 4: output: 'export' 설정 (Max) ✅
 * - Phase 5: 페이지 컴포넌트 정리 (Luna) ✅
 * - Phase 6: 빌드/배포 설정 (Max) ✅
 *
 * 배포 아키텍처:
 * - 기존 Pages 빌드: output: 'export' → out/ 디렉토리
 * - Workers 빌드: OpenNext가 SSR/ISR 런타임을 생성
 * - Workers 빌드는 NEXT_RUNTIME_TARGET=workers로 명시
 *
 * 개발 모드에서는 output: export 비활성화 (동적 라우트 지원)
 */
const nextConfig = {
  // 기존 Pages 배포는 정적 export를 유지하고, Workers 빌드에서는
  // OpenNext가 SSR/ISR용 Next 런타임을 생성하도록 output 설정을 비활성화합니다.
  ...(useStaticExport ? { output: 'export' } : {}),
  images: {
    loader: 'custom', // next-image-export-optimizer 사용
    imageSizes: [400],
    deviceSizes: [800],
  },
  transpilePackages: ['next-image-export-optimizer'], // 이미지 최적화 패키지
  reactCompiler: !isDev, // 개발 모드에서 비활성화 (HMR 속도 개선)
  // Worktrees have their own .next cache; never infer the parent checkout.
  turbopack: {
    root: __dirname,
    ...(isWorkers
      ? {
          // Workers bundle size reduction: avoid bundling next/og's resvg/wasm runtime.
          resolveAlias: {
            'next/og': './src/lib/workers-og-shim.ts',
          },
        }
      : {}),
  },
  sassOptions: {
    includePaths: [
      path.join(__dirname, 'src/styles'),
      path.join(__dirname, 'src/styles/abstracts'),
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: '', // SSG: Cloudflare Pages 기본 경로
    // next-image-export-optimizer 설정
    nextImageExportOptimizer_imageFolderPath: 'public/images',
    nextImageExportOptimizer_exportFolderPath: 'out',
    nextImageExportOptimizer_quality: '75',
    nextImageExportOptimizer_storePicturesInWEBP: 'true',
    nextImageExportOptimizer_exportFolderName: 'nextImageExportOptimizer',
    nextImageExportOptimizer_generateAndUseBlurImages: 'true',
    nextImageExportOptimizer_remoteImageCacheTTL: '0',
  },
  /**
   * 보안 헤더 설정 (SSG 모드)
   *
   * 참고: output: 'export' 모드에서는 headers()가 빌드에 포함되지 않습니다.
   * 대신 Cloudflare Pages의 _headers 파일 또는 Pages Functions에서 설정합니다.
   *
   * Cloudflare Pages _headers 파일 예시 (public/_headers):
   * ```
   * /*
   *   X-Frame-Options: DENY
   *   X-Content-Type-Options: nosniff
   *   Referrer-Policy: strict-origin-when-cross-origin
   *   X-XSS-Protection: 1; mode=block
   *   Permissions-Policy: camera=(), microphone=(), geolocation=()
   * ```
   */
  // SSG에서는 headers() 비활성화 - Cloudflare _headers로 대체
};

export default withNextIntl(nextConfig);
