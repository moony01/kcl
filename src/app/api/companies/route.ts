/**
 * Companies API Route
 *
 * 소속사 목록 조회 엔드포인트
 * - GET: 전체 소속사 목록 (순위순 정렬)
 *
 * T1.30: Redis 캐싱 적용
 * - 캐시 우선 조회 (TTL: 25초)
 * - 캐시 miss 시 Supabase 조회 후 캐시 저장
 * - 응답 헤더에 X-Cache-Status 추가 (hit/miss/mock)
 *
 * ===========================================
 * [DEV-CACHE] 개발 단계 캐시 비활성화
 * ===========================================
 * 환경 변수: CACHE_ENABLED=false 시
 * - Redis 캐시 조회/저장 스킵
 * - Supabase DB 직접 조회
 * - 리소스 절약 + 데이터 변경 즉시 확인
 *
 * 런칭 시: .env에서 CACHE_ENABLED=true 로 변경!
 * 검색 키워드: [DEV-CACHE]
 * ===========================================
 *
 * 응답 형식:
 * - companies: 소속사 배열
 * - totalCount: 전체 개수
 * - updatedAt: 데이터 갱신 시각
 * - source: 'cache' | 'db' | 'mock' (디버깅용)
 *
 * Fallback: Supabase 연결 실패 시 Mock 데이터 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { MOCK_COMPANIES } from '@/lib/mock-data';
import {
  getCachedCompanies,
  setCachedCompanies,
  CACHE_TTL,
  type CachedCompaniesData,
} from '@/lib/redis';

/**
 * Mock 데이터를 API 응답 형식으로 변환
 *
 * T1.42: firepower 기준 정렬 및 동적 rank 할당
 * T1.53: league_tier 기반 리그 분리 (리그 내 순위 부여)
 */
function getMockCompaniesResponse(tier?: string | null, limit?: string | null) {
  // T1.53: Mock 데이터에 league_tier 할당 (상위 10개 = premier)
  // 먼저 firepower 기준으로 정렬하여 상위 10개 판별
  const sortedForTier = [...MOCK_COMPANIES].sort((a, b) => b.firepower - a.firepower);
  const premierIds = new Set(sortedForTier.slice(0, 10).map((c) => c.id));

  // T1.53: 리그별로 분리하여 각각 정렬 및 rank 할당
  const premierCompanies = MOCK_COMPANIES.filter((c) => premierIds.has(c.id))
    .sort((a, b) => {
      if (b.firepower !== a.firepower) return b.firepower - a.firepower;
      return a.id.localeCompare(b.id);
    })
    .map((c, index) => ({
      id: c.id,
      name_ko: c.name.ko,
      name_en: c.name.en,
      slug: c.id.replace('co-', ''),
      logo_url: null,
      gradient_color: c.image,
      rank: index + 1, // 1부: 1-10
      firepower: c.firepower,
      league_tier: 'premier' as const,
      groups: c.representative.en.map((name, idx) => ({
        id: `group-${c.id}-${idx}`,
        name_en: name,
        name_ko: c.representative.ko[idx] || name,
        vote_count: 0,
      })),
    }));

  const challengersCompanies = MOCK_COMPANIES.filter((c) => !premierIds.has(c.id))
    .sort((a, b) => {
      if (b.firepower !== a.firepower) return b.firepower - a.firepower;
      return a.id.localeCompare(b.id);
    })
    .map((c, index) => ({
      id: c.id,
      name_ko: c.name.ko,
      name_en: c.name.en,
      slug: c.id.replace('co-', ''),
      logo_url: null,
      gradient_color: c.image,
      rank: 11 + index, // 2부: 11부터 시작
      firepower: c.firepower,
      league_tier: 'challengers' as const,
      groups: c.representative.en.map((name, idx) => ({
        id: `group-${c.id}-${idx}`,
        name_en: name,
        name_ko: c.representative.ko[idx] || name,
        vote_count: 0,
      })),
    }));

  // 전체 목록 (1부 → 2부 순서)
  let companies = [...premierCompanies, ...challengersCompanies];

  // T1.53: 리그 필터 (DB의 league_tier 기준)
  if (tier === 'premier') {
    companies = premierCompanies;
  } else if (tier === 'challengers') {
    companies = challengersCompanies;
  }

  // 개수 제한
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      companies = companies.slice(0, limitNum);
    }
  }

  return {
    companies,
    totalCount: companies.length,
    updatedAt: new Date().toISOString(),
    source: 'mock' as const,
  };
}

/**
 * Supabase에서 소속사 데이터 조회
 *
 * 리그 분리: firepower 기준 실시간 계산
 * - 1부(premier): firepower 상위 10개 회사 (rank 1-10)
 * - 2부(challengers): 나머지 회사들 (rank 11~)
 *
 * T1.42: firepower 기준 동적 정렬
 * T1.51: 동점 시 id 기준 정렬 (안정적 순서 보장)
 */
async function fetchFromSupabase(
  tier?: string | null,
  limit?: string | null,
): Promise<CachedCompaniesData | null> {
  const supabase = createServerClient();

  if (!supabase) {
    return null;
  }

  // T1.21: 그룹 정보(kcl_groups) 추가 조회
  const query = supabase
    .from('kcl_companies')
    .select(
      `
      id,
      name_ko,
      name_en,
      slug,
      logo_url,
      gradient_color,
      rank,
      firepower,
      league_tier,
      groups:kcl_groups (
        id,
        name_ko,
        name_en,
        vote_count
      )
    `,
    )
    .order('firepower', { ascending: false })
    .order('id', { ascending: true });

  const { data: rawCompanies, error } = await query;

  if (error) {
    console.error('[Companies API] Supabase error:', error.message);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCompanies = rawCompanies || [];

  // firepower 기준 실시간 리그 분리 (상위 10개 = 1부)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformCompany = (company: any, index: number, isPremier: boolean) => {
    const groups = company.groups as Array<{ vote_count?: number }> | undefined;
    const sortedGroups = Array.isArray(groups)
      ? [...groups].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 4)
      : [];

    return {
      id: company.id,
      name_ko: company.name_ko,
      name_en: company.name_en,
      slug: company.slug,
      logo_url: company.logo_url,
      gradient_color: company.gradient_color,
      firepower: company.firepower,
      league_tier: isPremier ? ('premier' as const) : ('challengers' as const),
      rank: index + 1, // 전체 순위 (1부터)
      groups: sortedGroups,
    };
  };

  // 전체 회사를 firepower 순으로 정렬 후 순위 부여
  const rankedCompanies = allCompanies.map(
    (company, index) => transformCompany(company, index, index < 10), // 상위 10개 = premier
  );

  // 1부 리그 (rank 1-10)
  const premierCompanies = rankedCompanies.filter((c) => c.rank <= 10);

  // 2부 리그 (rank 11~)
  const challengersCompanies = rankedCompanies.filter((c) => c.rank > 10);

  // 전체 목록 (1부 → 2부 순서)
  let companies = rankedCompanies as CachedCompaniesData['companies'];

  // 리그 필터 적용
  if (tier === 'premier') {
    companies = premierCompanies as CachedCompaniesData['companies'];
  } else if (tier === 'challengers') {
    companies = challengersCompanies as CachedCompaniesData['companies'];
  }

  // 개수 제한 적용
  if (limit) {
    const limitNum = parseInt(limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      companies = companies.slice(0, limitNum);
    }
  }

  return {
    companies,
    totalCount: companies.length,
    updatedAt: new Date().toISOString(),
    source: 'db',
  };
}

/**
 * 응답 헤더에 캐시 상태 추가
 */
function createResponse(
  data: CachedCompaniesData | ReturnType<typeof getMockCompaniesResponse>,
  cacheStatus: 'hit' | 'miss' | 'mock',
): NextResponse {
  const response = NextResponse.json(data);

  // 캐시 상태 헤더 추가 (디버깅용)
  response.headers.set('X-Cache-Status', cacheStatus);

  // 캐시 제어: 클라이언트 캐싱 비활성화 (서버 사이드 캐싱만 사용)
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier');
  const limit = searchParams.get('limit');

  // 필터가 없는 경우에만 캐시 사용 (전체 데이터 캐싱)
  const useCache = !tier && !limit;

  try {
    // 1. Redis 캐시 우선 조회 (필터 없는 경우만)
    if (useCache) {
      const cached = await getCachedCompanies();
      if (cached) {
        const responseTime = Date.now() - startTime;
        console.log(`[Companies API] Cache HIT (${responseTime}ms)`);
        return createResponse(cached, 'hit');
      }
    }

    // 2. Supabase에서 조회
    const dbData = await fetchFromSupabase(tier, limit);

    if (!dbData) {
      // Supabase 실패 시 Mock 데이터 반환
      console.warn('[Companies API] Supabase not available, using mock data');
      return createResponse(getMockCompaniesResponse(tier, limit), 'mock');
    }

    // 3. Redis에 캐시 저장 (필터 없는 전체 데이터만)
    if (useCache) {
      // 비동기로 캐시 저장 (응답 지연 방지)
      setCachedCompanies(dbData, CACHE_TTL.COMPANIES_RANKING).catch((err) => {
        console.error('[Companies API] Failed to cache data:', err);
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(`[Companies API] Cache MISS - DB fetch (${responseTime}ms)`);

    return createResponse(dbData, 'miss');
  } catch (error) {
    console.error('[Companies API] Unexpected error:', error);
    console.warn('[Companies API] Falling back to mock data');
    return createResponse(getMockCompaniesResponse(tier, limit), 'mock');
  }
}
