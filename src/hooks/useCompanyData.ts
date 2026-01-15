/**
 * useCompanyData 훅
 *
 * 개별 소속사 상세 정보를 가져오는 커스텀 훅입니다.
 * SWR을 사용하여 캐싱과 자동 갱신을 지원합니다.
 */

'use client';

import useSWR from 'swr';
import type { CompanyDetailResponse, GroupsResponse } from '@/types/api';

/** SWR fetcher 함수 */
const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch data');
  }
  return res.json();
};

interface UseCompanyDataOptions {
  /** 자동 갱신 간격 (ms), 0이면 비활성화 */
  refreshInterval?: number;
}

interface UseCompanyDataReturn {
  /** 소속사 정보 */
  company: CompanyDetailResponse['company'] | null;
  /** 소속 그룹 목록 */
  groups: CompanyDetailResponse['groups'];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 객체 */
  error: Error | null;
  /** 데이터 새로고침 */
  refresh: () => Promise<CompanyDetailResponse | undefined>;
}

/**
 * 소속사 상세 데이터 훅
 *
 * @param companyId - 소속사 UUID 또는 slug
 * @param options - SWR 옵션
 * @returns 소속사 데이터 및 상태
 *
 * @example
 * ```tsx
 * const { company, groups, isLoading } = useCompanyData('hybe');
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <h1>{company?.name_en}</h1>
 *     {groups.map(group => (
 *       <GroupItem key={group.id} {...group} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useCompanyData(
  companyId: string | null,
  options: UseCompanyDataOptions = {},
): UseCompanyDataReturn {
  const { refreshInterval = 0 } = options;

  const { data, error, isLoading, mutate } = useSWR<CompanyDetailResponse>(
    companyId ? `/api/companies/${companyId}` : null,
    fetcher,
    {
      refreshInterval,
      dedupingInterval: 10000, // 10초간 중복 요청 방지
    },
  );

  return {
    company: data?.company || null,
    groups: data?.groups || [],
    isLoading,
    error: error || null,
    refresh: mutate,
  };
}

interface UseCompanyGroupsOptions {
  /** 활동 중인 그룹만 조회 */
  activeOnly?: boolean;
  /** 그룹 타입 필터 */
  groupType?: 'boy' | 'girl' | 'solo' | 'co-ed';
}

interface UseCompanyGroupsReturn {
  /** 그룹 목록 */
  groups: GroupsResponse['groups'];
  /** 전체 개수 */
  totalCount: number;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 객체 */
  error: Error | null;
  /** 데이터 새로고침 */
  refresh: () => Promise<GroupsResponse | undefined>;
}

/**
 * 소속사별 그룹 목록 훅
 *
 * @param companyId - 소속사 UUID 또는 slug
 * @param options - 필터 옵션
 * @returns 그룹 목록 및 상태
 */
export function useCompanyGroups(
  companyId: string | null,
  options: UseCompanyGroupsOptions = {},
): UseCompanyGroupsReturn {
  const { activeOnly = true, groupType } = options;

  // URL 쿼리 파라미터 생성
  const params = new URLSearchParams();
  if (!activeOnly) params.set('active_only', 'false');
  if (groupType) params.set('group_type', groupType);
  const queryString = params.toString();

  const url = companyId
    ? `/api/companies/${companyId}/groups${queryString ? `?${queryString}` : ''}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<GroupsResponse>(url, fetcher, {
    dedupingInterval: 10000,
  });

  return {
    groups: data?.groups || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error: error || null,
    refresh: mutate,
  };
}

export default useCompanyData;
