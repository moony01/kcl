/**
 * useLeagueData 훅
 *
 * 리그 데이터(소속사 순위)를 가져오는 커스텀 훅입니다.
 * SWR을 사용하여 캐싱과 자동 갱신을 지원합니다.
 *
 * 기능:
 * - 1부 리그 (1-10위) / 2부 리그 (11위~) 분리
 * - 30초마다 자동 갱신
 * - 에러 처리 및 로딩 상태
 * - 수동 새로고침 (mutate)
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
 */
function transformToCompanyRanking(
  company: CompaniesResponse['companies'][number],
): CompanyRanking {
  const tier: LeagueTier = company.rank <= 10 ? 'premier' : 'challengers';

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
    isRelegationZone: company.rank === 10,
    isPromotionZone: company.rank === 11,
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
  const { refreshInterval = 30000, revalidateOnFocus = true, fallbackData } = options;

  const { data, error, isLoading, mutate } = useSWR<CompaniesResponse>('/api/companies', fetcher, {
    refreshInterval,
    revalidateOnFocus,
    dedupingInterval: 5000, // 5초간 중복 요청 방지
    fallbackData: fallbackData || undefined, // SSR 초기 데이터 전달
  });

  // 전체 소속사 변환
  const allCompanies = (data?.companies || []).map(transformToCompanyRanking);

  // 1부 리그 (1-10위)
  const premierLeague = allCompanies.filter((c) => c.rank <= 10);

  // 2부 리그 (11위~)
  const challengers = allCompanies.filter((c) => c.rank > 10);

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

  // 현재 1위
  const leader = allCompanies.find((c) => c.rank === 1) || null;

  return {
    premierLeague,
    challengers,
    allCompanies,
    season,
    promotionBattle,
    leader,
    isLoading,
    error: error || null,
    refresh: mutate,
    updatedAt: data?.updatedAt || null,
  };
}

export default useLeagueData;
