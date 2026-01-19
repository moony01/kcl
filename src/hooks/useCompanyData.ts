/**
 * useCompanyData 훅
 *
 * 개별 소속사 상세 정보를 가져오는 커스텀 훅입니다.
 * SWR을 사용하여 캐싱과 자동 갱신을 지원합니다.
 *
 * SSG/CSR 마이그레이션:
 * - 기존: fetch('/api/companies/[id]') → API Routes 경유
 * - 변경: getCompanyById() → Supabase 직접 호출
 */

'use client';

import useSWR from 'swr';
import type { GroupsResponse } from '@/types/api';
import {
  getCompanyById,
  getCompanyGroups,
  type CompanyDetail,
  type GroupDetail,
  type CompanyDetailResult,
  type CompanyGroupsResult,
} from '@/lib/api';

/** 내부용 소속사 상세 응답 타입 */
interface InternalCompanyDetailResponse {
  company: CompanyDetail;
  groups: GroupDetail[];
  groupCount: number;
}

/** SWR fetcher 함수: 소속사 상세 조회 */
const companyFetcher = async (companyId: string): Promise<InternalCompanyDetailResponse> => {
  const result: CompanyDetailResult = await getCompanyById(companyId);
  if (result.error || !result.company) {
    throw new Error(result.error || 'Failed to fetch company');
  }
  return {
    company: result.company,
    groups: result.groups,
    groupCount: result.groupCount,
  };
};

/** SWR fetcher 함수: 그룹 목록 조회 */
const groupsFetcher = async (args: {
  companyId: string;
  activeOnly: boolean;
  groupType?: string;
}): Promise<GroupsResponse> => {
  const result: CompanyGroupsResult = await getCompanyGroups(args.companyId, {
    activeOnly: args.activeOnly,
    groupType: args.groupType as 'boy' | 'girl' | 'solo' | 'co-ed' | undefined,
  });
  if (result.error) {
    throw new Error(result.error);
  }
  return {
    groups: result.groups,
    totalCount: result.totalCount,
    companyId: result.companyId,
  };
};

interface UseCompanyDataOptions {
  /** 자동 갱신 간격 (ms), 0이면 비활성화 */
  refreshInterval?: number;
}

interface UseCompanyDataReturn {
  /** 소속사 정보 */
  company: CompanyDetail | null;
  /** 소속 그룹 목록 */
  groups: GroupDetail[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 객체 */
  error: Error | null;
  /** 데이터 새로고침 */
  refresh: () => Promise<InternalCompanyDetailResponse | undefined>;
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

  // SSG/CSR 마이그레이션: Supabase 직접 호출
  // SWR key를 'company:{id}'로 변경 (URL 대신 키 문자열)
  const { data, error, isLoading, mutate } = useSWR<InternalCompanyDetailResponse>(
    companyId ? `company:${companyId}` : null,
    () => companyFetcher(companyId!),
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

  // SSG/CSR 마이그레이션: Supabase 직접 호출
  // SWR key를 'company-groups:{id}:{options}'로 변경
  const swrKey = companyId ? `company-groups:${companyId}:${activeOnly}:${groupType || ''}` : null;

  const { data, error, isLoading, mutate } = useSWR<GroupsResponse>(
    swrKey,
    () => groupsFetcher({ companyId: companyId!, activeOnly, groupType }),
    {
      dedupingInterval: 10000,
    },
  );

  return {
    groups: data?.groups || [],
    totalCount: data?.totalCount || 0,
    isLoading,
    error: error || null,
    refresh: mutate,
  };
}

export default useCompanyData;
