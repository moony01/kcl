/**
 * useVoteQuota Hook
 *
 * 일일 투표권 관리 훅
 * localStorage를 사용하여 클라이언트 사이드에서 투표권을 관리합니다.
 *
 * 규칙:
 * - 일일 투표권: 30회
 * - 리셋 시간: 자정 (UTC)
 * - 같은 회사 연속 투표: 허용
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/** localStorage 키 */
const STORAGE_KEY = 'kcl_vote_quota';

/** 일일 최대 투표권 */
export const MAX_DAILY_VOTES = 30;

/**
 * localStorage에 저장되는 투표권 데이터 구조
 */
interface VoteQuotaStorage {
  /** 날짜 (YYYY-MM-DD, UTC 기준) */
  date: string;
  /** 사용한 투표권 수 */
  used: number;
  /** 최대 투표권 (항상 30) */
  max: number;
}

/**
 * 투표권 정보
 */
export interface VoteQuota {
  /** 사용한 투표권 수 */
  used: number;
  /** 남은 투표권 수 */
  remaining: number;
  /** 최대 투표권 */
  max: number;
  /** 투표 가능 여부 */
  canVote: boolean;
  /** 리셋까지 남은 시간 (포맷팅된 문자열) */
  timeUntilReset: string;
  /** 리셋까지 남은 시간 (시간) */
  hoursUntilReset: number;
  /** 리셋까지 남은 시간 (분) */
  minutesUntilReset: number;
}

/**
 * useVoteQuota 훅 반환 타입
 */
export interface UseVoteQuotaReturn {
  /** 투표권 정보 */
  quota: VoteQuota;
  /** 투표권 사용 (성공 시 true 반환) */
  useVote: () => boolean;
  /** 로딩 상태 */
  isLoading: boolean;
}

/**
 * UTC 기준 오늘 날짜 문자열 반환 (YYYY-MM-DD)
 */
function getTodayUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * UTC 자정까지 남은 시간 계산
 */
function getTimeUntilMidnightUTC(): { hours: number; minutes: number; formatted: string } {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  const diff = tomorrow.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    hours,
    minutes,
    formatted: `${hours}시간 ${minutes}분`,
  };
}

/**
 * localStorage에서 투표권 데이터 읽기
 */
function loadQuotaFromStorage(): VoteQuotaStorage | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as VoteQuotaStorage;
  } catch {
    console.error('[useVoteQuota] Failed to parse quota from localStorage');
    return null;
  }
}

/**
 * localStorage에 투표권 데이터 저장
 */
function saveQuotaToStorage(data: VoteQuotaStorage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.error('[useVoteQuota] Failed to save quota to localStorage');
  }
}

/**
 * 일일 투표권 관리 훅
 *
 * @example
 * ```tsx
 * const { quota, useVote, isLoading } = useVoteQuota();
 *
 * const handleVote = async () => {
 *   if (!quota.canVote) {
 *     toast.error('투표권이 소진되었습니다');
 *     return;
 *   }
 *
 *   const success = await submitVoteToAPI();
 *   if (success) {
 *     useVote(); // 투표권 차감
 *   }
 * };
 * ```
 */
export function useVoteQuota(): UseVoteQuotaReturn {
  const [used, setUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeInfo, setTimeInfo] = useState<{ hours: number; minutes: number; formatted: string }>({
    hours: 0,
    minutes: 0,
    formatted: '',
  });

  /**
   * 초기화 및 날짜 체크
   * - 날짜가 바뀌면 투표권 리셋
   */
  useEffect(() => {
    const today = getTodayUTC();
    const stored = loadQuotaFromStorage();

    if (stored && stored.date === today) {
      // 같은 날이면 기존 데이터 사용
      setUsed(stored.used);
    } else {
      // 새 날짜면 리셋
      const newData: VoteQuotaStorage = {
        date: today,
        used: 0,
        max: MAX_DAILY_VOTES,
      };
      saveQuotaToStorage(newData);
      setUsed(0);
    }

    setIsLoading(false);
  }, []);

  /**
   * 리셋 시간 업데이트 (1분마다)
   */
  useEffect(() => {
    const updateTimeInfo = () => {
      setTimeInfo(getTimeUntilMidnightUTC());
    };

    updateTimeInfo();
    const interval = setInterval(updateTimeInfo, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  /**
   * 날짜 변경 체크 (1분마다)
   */
  useEffect(() => {
    const checkDateChange = () => {
      const today = getTodayUTC();
      const stored = loadQuotaFromStorage();

      if (stored && stored.date !== today) {
        // 날짜가 바뀌면 리셋
        const newData: VoteQuotaStorage = {
          date: today,
          used: 0,
          max: MAX_DAILY_VOTES,
        };
        saveQuotaToStorage(newData);
        setUsed(0);
      }
    };

    const interval = setInterval(checkDateChange, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, []);

  /**
   * 투표권 사용
   */
  const useVote = useCallback((): boolean => {
    const today = getTodayUTC();
    const stored = loadQuotaFromStorage();

    // 날짜 체크
    if (stored && stored.date !== today) {
      // 날짜가 바뀌었으면 리셋
      const newData: VoteQuotaStorage = {
        date: today,
        used: 1,
        max: MAX_DAILY_VOTES,
      };
      saveQuotaToStorage(newData);
      setUsed(1);
      return true;
    }

    const currentUsed = stored?.used ?? 0;

    // 투표권 소진 체크
    if (currentUsed >= MAX_DAILY_VOTES) {
      return false;
    }

    // 투표권 차감
    const newUsed = currentUsed + 1;
    const newData: VoteQuotaStorage = {
      date: today,
      used: newUsed,
      max: MAX_DAILY_VOTES,
    };
    saveQuotaToStorage(newData);
    setUsed(newUsed);

    return true;
  }, []);

  /**
   * 투표권 정보 계산
   */
  const quota: VoteQuota = useMemo(() => {
    const remaining = MAX_DAILY_VOTES - used;
    return {
      used,
      remaining,
      max: MAX_DAILY_VOTES,
      canVote: remaining > 0,
      timeUntilReset: timeInfo.formatted,
      hoursUntilReset: timeInfo.hours,
      minutesUntilReset: timeInfo.minutes,
    };
  }, [used, timeInfo]);

  return {
    quota,
    useVote,
    isLoading,
  };
}

export default useVoteQuota;
