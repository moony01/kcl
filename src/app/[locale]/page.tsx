/**
 * HomePage (리그 시스템) - Edge Runtime
 *
 * KCL 리그 시스템 메인 페이지
 * - Server Component로 동작
 * - 초기 데이터 Fetching 후 Client Component(HomeClient)로 전달
 *
 * @updated Cloudflare Edge Runtime 적용
 */

export const runtime = 'edge';

import { HomeClient } from './HomeClient';
import type { CompaniesResponse } from '@/types/api';

/**
 * 리그 데이터 서버 사이드 Fetching
 * Edge Runtime에서 동적 렌더링 (캐시 없음)
 */
async function getLeagueData(): Promise<CompaniesResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // 내부 API 호출 (절대 경로 필요)
    const res = await fetch(`${baseUrl}/api/companies`, {
      cache: 'no-store', // Edge에서 동적 fetch
    });

    if (!res.ok) {
      console.error('[HomePage] Failed to fetch league data:', res.status);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('[HomePage] Error fetching league data:', error);
    return null;
  }
}

export default async function HomePage() {
  // 서버 사이드 데이터 Fetching
  const initialData = await getLeagueData();

  // Client Component 렌더링 (초기 데이터 전달)
  return <HomeClient initialData={initialData} />;
}
