import { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/constants';

/**
 * 요청과 무관한 정적 Web App Manifest 생성
 *
 * SSR 전환 후에도 매니페스트 자체는 정적으로 생성한다.
 */

// 런타임 요청과 무관하므로 정적 생성 강제
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
