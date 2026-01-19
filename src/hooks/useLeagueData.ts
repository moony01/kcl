/**
 * useLeagueData 훅
 *
 * 리그 데이터(소속사 순위)를 가져오는 커스텀 훅입니다.
 * SWR을 사용하여 캐싱과 자동 갱신을 지원합니다.
 *
 * 기능:
 * - 1부 리그 (1-10위) / 2부 리그 (11위~) 분리
 * - 20초마다 자동 갱신 (T1.30: Redis 캐시 TTL 25초와 조화)
 * - 에러 처리 및 로딩 상태
 * - 수동 새로고침 (mutate)
 *
 * T1.30: Redis 캐싱 전략
 * - 서버: Redis 캐시 TTL 25초
 * - 클라이언트: SWR polling 20초
 * - 이를 통해 대부분의 요청이 캐시에서 즉시 응답 (< 50ms)
 */

'use client';

import useSWR from 'swr';
import type { CompanyRanking, LeagueTier, PromotionBattle, SeasonInfo } from '@/types/league';
import type { CompaniesResponse } from '@/types/api';

/** SWR fetcher 함수 */
const fetcher = async (url: string): Promise<CompaniesResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch data');
  }
  return res.json();
};

/**
 * DB 응답을 CompanyRanking 형식으로 변환
 *
 * T1.53: DB의 league_tier 값을 직접 사용 (시즌 중 고정)
 * - 기존: rank 기준으로 tier 계산 (투표 시 즉시 리그 변경 문제)
 * - 변경: DB에서 관리되는 league_tier 값 사용
 */
function transformToCompanyRanking(
  company: CompaniesResponse['companies'][number],
): CompanyRanking {
  // T1.53: DB의 league_tier 값을 직접 사용 (rank 기반 계산 제거)
  const tier: LeagueTier = company.league_tier;

  // T1.53: 1부 10위 = 강등 위기, 2부 1위(전체 11위) = 승격 기회
  // 1부 내 마지막 순위 = 강등 위기
  // 2부 내 첫 순위 = 승격 기회
  const isRelegationZone = tier === 'premier' && company.rank === 10;
  const isPromotionZone = tier === 'challengers' && company.rank === 11;

  return {
    companyId: company.id,
    companyName: company.name_en,
    nameKo: company.name_ko,
    nameEn: company.name_en,
    logoUrl: company.logo_url || '',
    gradientColor: company.gradient_color || '#8B5CF6',
    rank: company.rank,
    previousRank: company.rank, // TODO: 이전 순위 추적 기능 추가
    rankChange: 0,
    voteCount: company.firepower,
    voteCountHourly: 0, // TODO: 시간당 투표 수 계산 기능 추가
    tier,
    isRelegationZone,
    isPromotionZone,
    artists: {
      en: company.groups?.map((g) => g.name_en) || [],
      ko: company.groups?.map((g) => g.name_ko) || [],
    },
  };
}

/**
 * 현재 시즌 정보 생성
 */
function getCurrentSeason(): SeasonInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 월말까지 남은 일수 계산
  const lastDay = new Date(year, month, 0).getDate();
  const daysRemaining = lastDay - now.getDate();

  return {
    year,
    month,
    startDate: new Date(year, month - 1, 1).toISOString(),
    endDate: new Date(year, month, 0).toISOString(),
    daysRemaining,
    isActive: true,
  };
}

interface UseLeagueDataOptions {
  /** 자동 갱신 간격 (ms), 0이면 비활성화 */
  refreshInterval?: number;
  /** 포커스 시 재검증 */
  revalidateOnFocus?: boolean;
  /** SSR 초기 데이터 (서버에서 미리 fetch한 데이터) */
  fallbackData?: CompaniesResponse | null;
}

interface UseLeagueDataReturn {
  /** 1부 리그 소속사 (1-10위) */
  premierLeague: CompanyRanking[];
  /** 2부 리그 소속사 (11위~) */
  challengers: CompanyRanking[];
  /** 전체 소속사 목록 */
  allCompanies: CompanyRanking[];
  /** 시즌 정보 */
  season: SeasonInfo;
  /** 승강전 정보 */
  promotionBattle: PromotionBattle | null;
  /** 현재 1위 */
  leader: CompanyRanking | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 객체 */
  error: Error | null;
  /** 데이터 새로고침 */
  refresh: () => Promise<CompaniesResponse | undefined>;
  /** 마지막 업데이트 시간 */
  updatedAt: string | null;
}

/**
 * 리그 데이터 훅
 *
 * @param options - SWR 옵션
 * @returns 리그 데이터 및 상태
 *
 * @example
 * ```tsx
 * const { premierLeague, challengers, isLoading, refresh } = useLeagueData();
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     {premierLeague.map(company => (
 *       <RankingItem key={company.companyId} {...company} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useLeagueData(options: UseLeagueDataOptions = {}): UseLeagueDataReturn {
  // T1.30: 기본 polling 주기를 20초로 변경 (Redis 캐시 TTL 25초와 조화)
  const { refreshInterval = 20000, revalidateOnFocus = true, fallbackData } = options;

  // 개발 환경에서 불필요한 API 호출 방지
  const isDev = process.env.NODE_ENV === 'development';
  const hasFallback = !!fallbackData;

  // [DEV] 개발 환경: 옵션으로 전달된 refreshInterval도 무시하고 0으로 강제 (DB 부하 방지)
  // 프로덕션: 전달된 값 또는 기본값(20초) 사용
  const actualRefreshInterval = isDev ? 0 : refreshInterval;

  const { data, error, isLoading, mutate } = useSWR<CompaniesResponse>('/api/companies', fetcher, {
    refreshInterval: actualRefreshInterval,
    revalidateOnFocus: isDev ? false : revalidateOnFocus, // 개발 모드: 포커스 재검증 비활성화
    revalidateOnReconnect: !isDev, // 개발 모드: 네트워크 복구 시 재검증 비활성화
    revalidateOnMount: !hasFallback, // fallbackData 있으면 마운트 시 재검증 안 함
    dedupingInterval: isDev ? 2000 : 2000, // 투표 후 즉시 새로고침 위해 2초로 단축
    fallbackData: fallbackData || undefined, // SSR 초기 데이터 전달
  });

  // 전체 소속사 변환
  const allCompanies = (data?.companies || []).map(transformToCompanyRanking);

  // T1.53: DB의 league_tier 기준으로 리그 분리 (rank 기준 X)
  // 1부 리그 (league_tier === 'premier')
  const premierLeague = allCompanies.filter((c) => c.tier === 'premier');

  // 2부 리그 (league_tier === 'challengers')
  const challengers = allCompanies.filter((c) => c.tier === 'challengers');

  // 시즌 정보
  const season = getCurrentSeason();

  // 승강전 정보 (10위 vs 11위)
  const rank10 = allCompanies.find((c) => c.rank === 10);
  const rank11 = allCompanies.find((c) => c.rank === 11);
  const promotionBattle: PromotionBattle | null =
    rank10 && rank11
      ? {
          relegationCompany: rank10,
          promotionCompany: rank11,
          gap: rank10.voteCount - rank11.voteCount,
        }
      : null;

  // T1.51: 개발 모드 디버그 로그 - 승강전 데이터 누락 시 경고
  if (isDev && allCompanies.length > 0 && !promotionBattle) {
    console.warn('[useLeagueData] promotionBattle is null!', {
      totalCompanies: allCompanies.length,
      rank10: rank10 ? `${rank10.nameEn} (${rank10.voteCount})` : 'NOT FOUND',
      rank11: rank11 ? `${rank11.nameEn} (${rank11.voteCount})` : 'NOT FOUND',
      ranks: allCompanies.slice(8, 14).map((c) => `${c.rank}: ${c.nameEn}`),
    });
  }

  // 현재 1위
  const leader = allCompanies.find((c) => c.rank === 1) || null;

  // 강제 새로고침 (캐시 무시)
  const forceRefresh = async () => {
    return mutate(undefined, { revalidate: true });
  };

  return {
    premierLeague,
    challengers,
    allCompanies,
    season,
    promotionBattle,
    leader,
    isLoading,
    error: error || null,
    refresh: forceRefresh,
    updatedAt: data?.updatedAt || null,
  };
}

export default useLeagueData;
