/**
 * useHallOfFame 훅
 *
 * 명예의 전당 데이터를 가져오는 커스텀 훅입니다.
 * T1.58: /api/hall-of-fame API 연동, Mock 폴백 지원
 * 환경변수 또는 API 가용성에 따라 Mock/API 데이터를 자동 전환합니다.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refresh, dataSource } = useHallOfFame();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { HallOfFameData, MonthlyChampion, YearlyWinCount } from '@/types/hall-of-fame';
import {
  getMockHallOfFameData,
  getMockMonthlyChampions,
  getMockYearlyRace,
} from '@/lib/mock-hall-of-fame';

/**
 * 월간 챔피언 목록에서 연간 우승 횟수 집계
 */
function calculateYearlyRace(champions: MonthlyChampion[]): YearlyWinCount[] {
  if (champions.length === 0) return [];

  const year = champions[0].year;
  const countMap = new Map<string, YearlyWinCount>();

  for (const champion of champions) {
    const existing = countMap.get(champion.companyId);
    if (existing) {
      existing.winCount += 1;
    } else {
      countMap.set(champion.companyId, {
        year,
        companyId: champion.companyId,
        companyName: champion.companyName,
        companyLogo: champion.companyLogo,
        winCount: 1,
        rank: 0,
      });
    }
  }

  // 우승 횟수 기준 내림차순 정렬 후 순위 부여
  const sorted = Array.from(countMap.values()).sort((a, b) => b.winCount - a.winCount);
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  return sorted;
}

/** Hook 반환 타입 */
interface UseHallOfFameReturn {
  /** 명예의 전당 전체 데이터 */
  data: HallOfFameData | null;
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 특정 연도의 월간 챔피언 가져오기 */
  getMonthlyChampions: (year: number) => MonthlyChampion[];
  /** 특정 연도의 경쟁 현황 가져오기 */
  getYearlyRace: (year: number) => YearlyWinCount[];
  /** 데이터 새로고침 */
  refresh: () => void;
  /** 데이터 소스 (mock | api) */
  dataSource: 'mock' | 'api';
}

/** API 엔드포인트 */
const API_ENDPOINT = '/api/hall-of-fame';

/** Mock 모드 강제 사용 여부 (환경변수로 제어) */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/**
 * 명예의 전당 데이터 훅
 *
 * API가 준비되면 자동으로 API 데이터를 사용하고,
 * API 호출 실패 시 Mock 데이터로 폴백합니다.
 */
export function useHallOfFame(): UseHallOfFameReturn {
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'mock' | 'api'>('mock');

  /** 월간 챔피언 캐시 (연도별) */
  const monthlyCache = useRef<Map<number, MonthlyChampion[]>>(new Map());
  /** 연간 경쟁현황 캐시 (연도별) */
  const raceCache = useRef<Map<number, YearlyWinCount[]>>(new Map());
  /** 전체 월간 챔피언 캐시 (연도별 조회용) */
  const allChampionsRef = useRef<MonthlyChampion[]>([]);

  /**
   * API에서 데이터 가져오기 시도
   */
  const fetchFromApi = useCallback(async (): Promise<HallOfFameData | null> => {
    try {
      const response = await fetch(API_ENDPOINT);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const apiData: HallOfFameData = await response.json();

      // 월간 챔피언 데이터 캐시
      if (apiData.currentYearMonthly && apiData.currentYearMonthly.length > 0) {
        allChampionsRef.current = [
          ...allChampionsRef.current.filter((c) => c.year !== apiData.currentYear),
          ...apiData.currentYearMonthly,
        ];
      }

      setDataSource('api');
      return apiData;
    } catch (err) {
      console.warn('[useHallOfFame] API 호출 실패, Mock 데이터로 폴백합니다.', err);
      return null;
    }
  }, []);

  /**
   * Mock 데이터 가져오기
   */
  const fetchFromMock = useCallback(async (): Promise<HallOfFameData> => {
    // 네트워크 지연 시뮬레이션 (개발 시 로딩 상태 확인용)
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDataSource('mock');
    return getMockHallOfFameData();
  }, []);

  /**
   * 데이터 로드 (API 우선, Mock 폴백)
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let result: HallOfFameData | null = null;

      // Mock 모드 강제 사용이 아니면 API 먼저 시도
      if (!USE_MOCK) {
        result = await fetchFromApi();
      }

      // API 실패 또는 Mock 모드면 Mock 데이터 사용
      if (!result) {
        result = await fetchFromMock();
      }

      setData(result);

      // 캐시 초기화
      monthlyCache.current.clear();
      raceCache.current.clear();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(message);
      console.error('[useHallOfFame] 데이터 로드 실패:', message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromApi, fetchFromMock]);

  /**
   * 특정 연도의 월간 챔피언 가져오기
   */
  const getMonthlyChampions = useCallback((year: number): MonthlyChampion[] => {
    // 캐시 확인
    const cached = monthlyCache.current.get(year);
    if (cached) return cached;

    // API 데이터에서 해당 연도 필터링
    const fromApi = allChampionsRef.current.filter((c) => c.year === year);
    if (fromApi.length > 0) {
      const sorted = fromApi.sort((a, b) => a.month - b.month);
      monthlyCache.current.set(year, sorted);
      return sorted;
    }

    // Fallback: Mock 데이터
    const fromMock = getMockMonthlyChampions(year);
    monthlyCache.current.set(year, fromMock);
    return fromMock;
  }, []);

  /**
   * 특정 연도의 경쟁 현황 가져오기
   */
  const getYearlyRace = useCallback(
    (year: number): YearlyWinCount[] => {
      // 캐시 확인
      const cached = raceCache.current.get(year);
      if (cached) return cached;

      // 현재 데이터의 연도와 일치하면 API 데이터 사용
      if (data && data.currentYear === year && data.currentYearRace.length > 0) {
        raceCache.current.set(year, data.currentYearRace);
        return data.currentYearRace;
      }

      // 캐시된 월간 챔피언에서 계산
      const yearChampions = allChampionsRef.current.filter((c) => c.year === year);
      if (yearChampions.length > 0) {
        const calculated = calculateYearlyRace(yearChampions);
        raceCache.current.set(year, calculated);
        return calculated;
      }

      // Fallback: Mock 데이터
      const fromMock = getMockYearlyRace(year);
      raceCache.current.set(year, fromMock);
      return fromMock;
    },
    [data],
  );

  /**
   * 데이터 새로고침
   */
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    getMonthlyChampions,
    getYearlyRace,
    refresh,
    dataSource,
  };
}

export default useHallOfFame;
