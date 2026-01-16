/**
 * useRefreshCountdown 훅
 *
 * 데이터 갱신 주기를 시각적으로 표시하기 위한 카운트다운 훅입니다.
 * SeasonHeader에서 "실시간 업데이트" 옆에 남은 시간을 표시합니다.
 *
 * 기능:
 * - 지정된 간격(기본 20초)으로 카운트다운
 * - 0초 도달 시 "갱신 중" 상태 표시
 * - SWR refreshInterval과 동기화하여 사용
 *
 * @created T1.31 - 실시간 업데이트 카운트다운 UI
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/** useRefreshCountdown 훅 반환 타입 */
export interface UseRefreshCountdownReturn {
  /** 남은 초 (0-intervalSeconds) */
  countdown: number;
  /** 데이터 갱신 중 상태 */
  isRefreshing: boolean;
  /** 수동 리셋 함수 */
  reset: () => void;
}

/** useRefreshCountdown 훅 옵션 */
export interface UseRefreshCountdownOptions {
  /** 갱신 간격 (밀리초, 기본값: 20000ms) */
  intervalMs?: number;
  /** 갱신 중 표시 지속 시간 (밀리초, 기본값: 1500ms) */
  refreshingDurationMs?: number;
  /** 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

/**
 * 데이터 갱신 카운트다운 훅
 *
 * @param options - 훅 옵션
 * @returns 카운트다운 상태 및 제어 함수
 *
 * @example
 * ```tsx
 * const { countdown, isRefreshing, reset } = useRefreshCountdown({
 *   intervalMs: 20000, // 20초 주기
 * });
 *
 * return (
 *   <div>
 *     {isRefreshing ? '갱신 중...' : `${countdown}초`}
 *   </div>
 * );
 * ```
 */
export function useRefreshCountdown(
  options: UseRefreshCountdownOptions = {},
): UseRefreshCountdownReturn {
  const { intervalMs = 20000, refreshingDurationMs = 1500, enabled = true } = options;

  // 초 단위로 변환
  const intervalSeconds = Math.floor(intervalMs / 1000);

  // 상태
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 타이머 참조 (cleanup용)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshingTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 카운트다운 리셋 함수
   * 외부에서 데이터 갱신 시 호출하여 동기화 가능
   */
  const reset = useCallback(() => {
    setCountdown(intervalSeconds);
    setIsRefreshing(false);

    // 기존 갱신 중 타이머 클리어
    if (refreshingTimerRef.current) {
      clearTimeout(refreshingTimerRef.current);
      refreshingTimerRef.current = null;
    }
  }, [intervalSeconds]);

  // 카운트다운 효과
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 1초마다 카운트다운 감소
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 0초 도달 → 갱신 중 상태로 전환
          setIsRefreshing(true);

          // 일정 시간 후 갱신 완료 처리
          refreshingTimerRef.current = setTimeout(() => {
            setIsRefreshing(false);
          }, refreshingDurationMs);

          // 카운트다운 리셋
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (refreshingTimerRef.current) {
        clearTimeout(refreshingTimerRef.current);
        refreshingTimerRef.current = null;
      }
    };
  }, [enabled, intervalSeconds, refreshingDurationMs]);

  // 초기 마운트 시 카운트다운 값 설정
  useEffect(() => {
    setCountdown(intervalSeconds);
  }, [intervalSeconds]);

  return {
    countdown,
    isRefreshing,
    reset,
  };
}

export default useRefreshCountdown;
