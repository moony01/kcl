import { MetadataRoute } from 'next';
import { BASE_PATH } from '@/lib/constants';
import {
  BRAND_DESCRIPTION,
  BRAND_MARK_PATH,
  BRAND_NAME,
  BRAND_THEME_COLOR,
  BRAND_TITLE,
} from '@/lib/brand';

/**
 * SSG 모드에서 정적 Web App Manifest 생성
 *
 * output: 'export' 모드에서는 dynamic = 'force-static' 필수
 */

// SSG export 모드에서 정적 생성 강제
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_TITLE,
    short_name: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    theme_color: BRAND_THEME_COLOR,
    background_color: '#080B14',
    icons: [
      {
        src: `${BASE_PATH}${BRAND_MARK_PATH}`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
