/**
 * useVoteQuota Hook
 *
 * 투표권 관리 훅
 *
 * 모드별 동작:
 * - 비로그인: localStorage 기반 일일 게스트 한도 (기본 100회, UTC 자정 리셋)
 * - 로그인 회원: 서버 기반 일일 300회 (get_user_vote_stats RPC 조회)
 * - 내부 운영 계정: 서버 override 기반 일일 500회
 *
 * Pro 구독 노출은 중단했고, 투표권 정책은 일반 회원 중심으로 단순화합니다.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VOTE_LIMITS } from '@/config/vote';
import {
  DEVELOPMENT_TEST_USER_ID,
  getVoteBackendUserId,
  isDevelopmentTestModeEnabled,
} from '@/lib/auth/development-test-mode';
import { getUserVoteStats } from '@/lib/api';
import {
  getTodayUTC,
  VOTE_QUOTA_REFRESH_EVENT,
  VOTE_QUOTA_STORAGE_KEY,
} from '@/lib/vote-quota';

export {
  getTodayUTC,
  resetGuestVoteQuota,
  VOTE_QUOTA_REFRESH_EVENT,
  VOTE_QUOTA_STORAGE_KEY,
} from '@/lib/vote-quota';

const STORAGE_KEY = VOTE_QUOTA_STORAGE_KEY;

/** 비로그인 일일 최대 투표권 */
export const MAX_DAILY_VOTES = VOTE_LIMITS.GUEST_DAILY;

/** 로그인 회원 일일 최대 투표권 */
export const MAX_DAILY_VOTES_LOGIN = VOTE_LIMITS.MEMBER_DAILY;

/** 내부 운영 계정 일일 최대 투표권 (DB override로 서버에서 결정) */
export const MAX_DAILY_VOTES_OWNER = VOTE_LIMITS.OWNER_DAILY;

/** 1회 파워투표 최대치 */
export const MAX_POWER_VOTE = VOTE_LIMITS.POWER_MAX;

/**
 * localStorage에 저장되는 투표권 데이터 구조 (비로그인용)
 */
interface VoteQuotaStorage {
  /** 날짜 (YYYY-MM-DD, UTC 기준) */
  date: string;
  /** 사용한 투표권 수 */
  used: number;
  /** 최대 투표권 */
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
  /** 투표 모드 */
  mode: 'daily';
}

/**
 * useVoteQuota 훅 반환 타입
 */
export interface UseVoteQuotaReturn {
  /** 투표권 정보 */
  quota: VoteQuota;
  /** 투표권 사용 (count만큼 차감, 성공 시 true) */
  useVote: (count?: number) => boolean;
  /** 서버에서 최신 투표 통계 다시 가져오기 (로그인 사용자 전용) */
  refetchStats: () => Promise<void>;
  /** 로딩 상태 */
  isLoading: boolean;
}

export interface UseVoteQuotaOptions {
  /** 임베드 등 출처별 비회원 일일 한도 */
  guestDailyLimit?: number;
  /** 출처별 비회원 잔여량 저장 키 */
  storageKey?: string;
  /** 외부 quota 컨트롤러를 주입하는 카드에서는 내부 조회/타이머를 비활성화 */
  enabled?: boolean;
}

/**
 * UTC 자정까지 남은 시간 계산 (비로그인용 일일 리셋)
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
function loadQuotaFromStorage(storageKey: string): VoteQuotaStorage | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(storageKey);
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
function saveQuotaToStorage(storageKey: string, data: VoteQuotaStorage): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    console.error('[useVoteQuota] Failed to save quota to localStorage');
  }
}

/**
 * 투표권 관리 훅
 *
 * @param userId - 로그인 사용자 ID (null이면 비로그인 모드)
 *
 * @example
 * ```tsx
 * // 비로그인: 일일 100표 (localStorage)
 * const { quota, useVote } = useVoteQuota();
 *
 * // 로그인: 일일 300표 (서버 조회, 운영 override는 서버 dailyLimit 반영)
 * const { user } = useAuth();
 * const { quota, useVote } = useVoteQuota(user?.id);
 *
 * // 파워투표: 한번에 5표 소비
 * useVote(5);
 * ```
 */
export function useVoteQuota(
  userId?: string | null,
  options: UseVoteQuotaOptions = {},
): UseVoteQuotaReturn {
  // The browser session is local-only, but its id is backed by a provisioned
  // Supabase fixture. Keep quota state local because there is no browser JWT;
  // vote writes still use the fixture id through submitVote().
  const isLocalDeveloperSession =
    isDevelopmentTestModeEnabled() && userId === DEVELOPMENT_TEST_USER_ID;
  const backendUserId = isLocalDeveloperSession ? null : getVoteBackendUserId(userId);
  const guestDailyLimit = Math.max(
    1,
    Math.floor(options.guestDailyLimit ?? MAX_DAILY_VOTES),
  );
  const storageKey = options.storageKey ?? STORAGE_KEY;
  const enabled = options.enabled ?? true;
  const [used, setUsed] = useState<number>(0);
  const [max, setMax] = useState<number>(
    isLocalDeveloperSession ? MAX_DAILY_VOTES_LOGIN : guestDailyLimit,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeInfo, setTimeInfo] = useState<{ hours: number; minutes: number; formatted: string }>({
    hours: 0,
    minutes: 0,
    formatted: '',
  });

  const mode = 'daily' as const;

  /**
   * 서버에서 로그인 사용자 투표 통계 가져오기
   */
  const fetchServerStats = useCallback(async () => {
    if (!enabled || !backendUserId) return;

    try {
      const stats = await getUserVoteStats(backendUserId);
      if (stats) {
        setUsed(stats.dailyUsed);
        setMax(stats.dailyLimit);
      } else {
        setMax(MAX_DAILY_VOTES_LOGIN);
      }
    } catch (error) {
      console.error('[useVoteQuota] Failed to fetch server stats:', error);
      setMax(MAX_DAILY_VOTES_LOGIN);
    }
  }, [backendUserId, enabled]);

  /**
   * 초기화: 모드에 따라 다른 소스에서 데이터 로드
   * userId가 변경되면 로딩 상태를 리셋하기 위해 key 기반 리렌더링 대신
   * 로딩 플래그를 true로 초기화하여 처리
   */
  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      return () => {
        cancelled = true;
      };
    }

    if (isLocalDeveloperSession) {
      // Reset when a mounted hook transitions from guest to the local member fixture.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsed(0);
      setMax(MAX_DAILY_VOTES_LOGIN);
      if (!cancelled) setIsLoading(false);
    } else if (backendUserId) {
      // 로그인 모드: 서버 통계를 일일 한도로 사용
      fetchServerStats().finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    } else {
      // 비로그인 모드: localStorage에서 일일 통계 가져오기
      setMax(guestDailyLimit);
      const today = getTodayUTC();
      const stored = loadQuotaFromStorage(storageKey);

      if (stored && stored.date === today) {
        setUsed(Math.min(stored.used, guestDailyLimit));
      } else {
        const newData: VoteQuotaStorage = {
          date: today,
          used: 0,
          max: guestDailyLimit,
        };
        saveQuotaToStorage(storageKey, newData);
        setUsed(0);
      }

      if (!cancelled) setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [backendUserId, enabled, fetchServerStats, guestDailyLimit, isLocalDeveloperSession, storageKey]);

  /**
   * 리셋 시간 업데이트 (1분마다)
   */
  useEffect(() => {
    if (!enabled) return;

    const updateTimeInfo = () => {
      setTimeInfo(getTimeUntilMidnightUTC());
    };

    updateTimeInfo();
    const interval = setInterval(updateTimeInfo, 60000);

    return () => clearInterval(interval);
  }, [enabled]);

  /**
   * 날짜 변경 체크 (1분마다)
   * - 비로그인: localStorage 리셋
   * - 로그인: 서버에서 최신 통계 다시 가져오기
   */
  useEffect(() => {
    if (!enabled) return;

    /** 날짜 변경 기준점 */
    let lastDate = getTodayUTC();

    const checkDateChange = () => {
      const today = getTodayUTC();
      if (lastDate === today) return;
      lastDate = today;

      if (isLocalDeveloperSession) {
        setUsed(0);
        setMax(MAX_DAILY_VOTES_LOGIN);
      } else if (backendUserId) {
        // 로그인 모드: 서버에서 일일 통계 다시 가져오기 (UTC 자정 리셋)
        fetchServerStats();
      } else {
        // 비로그인 모드: localStorage 리셋
        const stored = loadQuotaFromStorage(storageKey);
        if (stored && stored.date !== today) {
          const newData: VoteQuotaStorage = {
            date: today,
            used: 0,
            max: guestDailyLimit,
          };
          saveQuotaToStorage(storageKey, newData);
          setUsed(0);
        }
      }
    };

    const interval = setInterval(checkDateChange, 60000);

    return () => clearInterval(interval);
  }, [backendUserId, enabled, fetchServerStats, guestDailyLimit, isLocalDeveloperSession, storageKey]);

  /** 개발 도구 등 다른 탭/컨트롤의 게스트 quota 갱신 반영 */
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    const handleQuotaRefresh = () => {
      if (backendUserId || isLocalDeveloperSession) return;

      const stored = loadQuotaFromStorage(storageKey);
      if (stored?.date !== getTodayUTC()) return;

      setMax(guestDailyLimit);
      setUsed(Math.min(stored.used, guestDailyLimit));
    };

    window.addEventListener(VOTE_QUOTA_REFRESH_EVENT, handleQuotaRefresh);
    return () => window.removeEventListener(VOTE_QUOTA_REFRESH_EVENT, handleQuotaRefresh);
  }, [backendUserId, enabled, guestDailyLimit, isLocalDeveloperSession, storageKey]);

  /**
   * 투표권 사용 (클라이언트 측 낙관적 업데이트)
   *
   * @param count - 소비할 투표 수 (기본값 1, 파워투표 시 1~100)
   * @returns 성공 여부
   */
  const useVote = useCallback(
    (count: number = 1): boolean => {
      if (backendUserId || isLocalDeveloperSession) {
        // 로그인 모드: 서버 통계를 기반으로 낙관적으로 차감
        const newUsed = used + count;
        if (newUsed > max) return false;
        setUsed(newUsed);
        return true;
      }

      // 비로그인 모드: localStorage 기반
      const today = getTodayUTC();
      const stored = loadQuotaFromStorage(storageKey);

      if (stored && stored.date !== today) {
        // 날짜가 바뀌었으면 리셋 후 차감
        const newData: VoteQuotaStorage = {
          date: today,
          used: count,
          max: guestDailyLimit,
        };
        saveQuotaToStorage(storageKey, newData);
        setUsed(count);
        return true;
      }

      const currentUsed = stored?.used ?? 0;

      if (currentUsed + count > guestDailyLimit) {
        return false;
      }

      const newUsed = currentUsed + count;
      const newData: VoteQuotaStorage = {
        date: today,
        used: newUsed,
        max: guestDailyLimit,
      };
      saveQuotaToStorage(storageKey, newData);
      setUsed(newUsed);

      return true;
    },
    [backendUserId, guestDailyLimit, isLocalDeveloperSession, storageKey, used, max],
  );

  /**
   * 서버에서 최신 통계 다시 가져오기 (로그인 모드 전용)
   */
  const refetchStats = useCallback(async () => {
    if (enabled && backendUserId && !isLocalDeveloperSession) {
      await fetchServerStats();
    }
  }, [backendUserId, enabled, fetchServerStats, isLocalDeveloperSession]);

  /**
   * 투표권 정보 계산
   */
  const quota: VoteQuota = useMemo(() => {
    const remaining = max - used;
    return {
      used,
      remaining,
      max,
      canVote: remaining > 0,
      timeUntilReset: timeInfo.formatted,
      hoursUntilReset: timeInfo.hours,
      minutesUntilReset: timeInfo.minutes,
      mode,
    };
  }, [used, max, timeInfo, mode]);

  return {
    quota,
    useVote,
    refetchStats,
    isLoading,
  };
}

export default useVoteQuota;
