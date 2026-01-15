/**
 * useHallOfFame 훅
 *
 * 명예의 전당 데이터를 가져오는 커스텀 훅입니다.
 * 현재는 Mock 데이터를 사용하며, 추후 Supabase 연동 예정입니다.
 */

import { useState, useEffect, useCallback } from 'react';
import type { HallOfFameData, MonthlyChampion, YearlyWinCount } from '@/types/hall-of-fame';
import {
  getMockHallOfFameData,
  getMockMonthlyChampions,
  getMockYearlyRace,
} from '@/lib/mock-hall-of-fame';

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
}

/**
 * 명예의 전당 데이터 훅
 */
export function useHallOfFame(): UseHallOfFameReturn {
  const [data, setData] = useState<HallOfFameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 데이터 로드
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: 실제 API 호출로 대체
      // const response = await fetch('/api/hall-of-fame');
      // const data = await response.json();

      // Mock 데이터 사용 (약간의 딜레이 시뮬레이션)
      await new Promise((resolve) => setTimeout(resolve, 300));
      const mockData = getMockHallOfFameData();
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 특정 연도의 월간 챔피언 가져오기
   */
  const getMonthlyChampions = useCallback((year: number): MonthlyChampion[] => {
    // TODO: 실제 API 호출로 대체
    return getMockMonthlyChampions(year);
  }, []);

  /**
   * 특정 연도의 경쟁 현황 가져오기
   */
  const getYearlyRace = useCallback((year: number): YearlyWinCount[] => {
    // TODO: 실제 API 호출로 대체
    return getMockYearlyRace(year);
  }, []);

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
  };
}

export default useHallOfFame;
