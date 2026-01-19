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
 */
function getMockCompaniesResponse(tier?: string | null, limit?: string | null) {
  // T1.42: firepower 기준 내림차순 정렬
  // T1.51: 동점 시 id 기준 정렬 (안정적 순서 보장)
  const sortedMock = [...MOCK_COMPANIES].sort((a, b) => {
    if (b.firepower !== a.firepower) {
      return b.firepower - a.firepower;
    }
    return a.id.localeCompare(b.id);
  });

  // T1.42: 동적 rank 할당
  let companies = sortedMock.map((c, index) => ({
    id: c.id,
    name_ko: c.name.ko,
    name_en: c.name.en,
    slug: c.id.replace('co-', ''),
    logo_url: null,
    gradient_color: c.image,
    rank: index + 1, // T1.42: 동적 rank
    firepower: c.firepower,
    // T1.21: Mock 데이터 그룹 매핑
    groups: c.representative.en.map((name, idx) => ({
      id: `group-${c.id}-${idx}`,
      name_en: name,
      name_ko: c.representative.ko[idx] || name,
      vote_count: 0,
    })),
  }));

  // T1.42: 리그 필터 (동적 rank 기준)
  if (tier === 'premier') {
    companies = companies.filter((c) => c.rank <= 10);
  } else if (tier === 'challengers') {
    companies = companies.filter((c) => c.rank > 10);
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
 * T1.42: firepower 기준 동적 정렬 및 rank 재계산
 * - 기존: ORDER BY rank (정적, 투표 후 갱신 안 됨)
 * - 변경: ORDER BY firepower DESC (동적, 투표 즉시 반영)
 */
async function fetchFromSupabase(
  tier?: string | null,
  limit?: string | null,
): Promise<CachedCompaniesData | null> {
  const supabase = createServerClient();

  if (!supabase) {
    return null;
  }

  // T1.42: firepower 기준 내림차순 정렬 (동적 순위)
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
      groups:kcl_groups (
        id,
        name_ko,
        name_en,
        vote_count
      )
    `,
    )
    .order('firepower', { ascending: false }) // T1.42: rank → firepower
    .order('id', { ascending: true }); // T1.51: 동점 시 id 기준 정렬 (안정적 순서 보장)

  const { data: rawCompanies, error } = await query;

  if (error) {
    console.error('[Companies API] Supabase error:', error.message);
    return null;
  }

  // T1.42: firepower 기준 정렬 후 동적 rank 할당
  // T1.21: 그룹별 vote_count 상위 4개 추출
  let companies = (rawCompanies || []).map((company, index) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const groups = (company as any).groups as Array<{ vote_count?: number }> | undefined;
    const sortedGroups = Array.isArray(groups)
      ? [...groups].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 4)
      : [];

    return {
      ...company,
      rank: index + 1, // T1.42: 동적 rank 할당 (1부터 시작)
      groups: sortedGroups,
    };
  }) as CachedCompaniesData['companies'];

  // T1.42: 리그 필터 적용 (동적 rank 기준)
  if (tier === 'premier') {
    companies = companies.filter((c) => c.rank <= 10);
  } else if (tier === 'challengers') {
    companies = companies.filter((c) => c.rank > 10);
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
