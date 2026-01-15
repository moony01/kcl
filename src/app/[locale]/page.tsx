/**
 * HomePage (리그 시스템) - SSR 적용됨
 *
 * KCL 리그 시스템 메인 페이지
 * - Server Component로 동작
 * - 초기 데이터 Fetching 후 Client Component(HomeClient)로 전달
 *
 * @updated T1.19 - SSR 적용
 */

import { HomeClient } from './HomeClient';
import type { CompaniesResponse } from '@/types/api';

export const runtime = 'edge';

/**
 * 리그 데이터 서버 사이드 Fetching
 * 30초마다 Revalidation (ISR)
 */
async function getLeagueData(): Promise<CompaniesResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    // 내부 API 호출 (절대 경로 필요)
    const res = await fetch(`${baseUrl}/api/companies`, {
      next: { revalidate: 30 }, // 30초 ISR
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
