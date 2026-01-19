import { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/constants';

/**
 * SSG 모드에서 정적 Web App Manifest 생성
 *
 * output: 'export' 모드에서는 dynamic = 'force-static' 필수
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kpop Company League',
    short_name: 'KCL',
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    theme_color: '#8B5CF6',
    background_color: '#0a0a0a',
    icons: [
      {
        src: `${BASE_PATH}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${BASE_PATH}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
