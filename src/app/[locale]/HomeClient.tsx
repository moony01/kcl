/**
 * KCL 홈 클라이언트 표면
 *
 * 홈은 회사 카드 목록과 직접투표만 담당합니다. 검색/선택/BottomSheet/
 * StickyPanel은 공통 임베드 표면에서 계속 사용하므로 이 경로에서는 렌더링하지 않습니다.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompanyRanking } from '@/types/league';
import type { CompaniesResponse } from '@/types/api';
import { useLeagueData } from '@/hooks/useLeagueData';
import { useAuth } from '@/hooks/useAuth';
import { useVote } from '@/hooks/useVote';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import HomeCompanyList, {
  HOME_DIRECT_VOTE_UNIT,
  type HomeVoteState,
} from '@/components/features/home/HomeCompanyList';
import styles from './page.module.scss';

interface HomeClientProps {
  /** 서버에서 미리 fetch한 초기 데이터 (옵셔널, SSG에서는 사용 안 함) */
  initialData?: CompaniesResponse | null;
}

/**
 * 홈 카드 직접투표 수량.
 *
 * 기본은 100표이며, 클라이언트 quota가 그보다 적을 때만 잔여량으로 줄입니다.
 * 최종 허용량은 submit_vote_secure RPC가 다시 검증합니다.
 */
export function getHomeDirectVoteAmount(remaining: number): number {
  if (!Number.isFinite(remaining)) return 0;
  return Math.min(HOME_DIRECT_VOTE_UNIT, Math.max(0, Math.floor(remaining)));
}

function getSuccessfulVoteScore(
  voteScore: number | undefined,
  requested: number,
): number {
  if (!Number.isFinite(voteScore)) return requested;
  return Math.min(requested, Math.max(1, Math.floor(voteScore as number)));
}

function getRemainingAfterVote(
  serverRemaining: number | undefined,
  currentRemaining: number,
  consumed: number,
): number {
  if (Number.isFinite(serverRemaining)) {
    return Math.max(0, Math.floor(serverRemaining as number));
  }
  return Math.max(0, currentRemaining - consumed);
}

/**
 * 홈페이지 클라이언트
 *
 * @param initialData - 서버에서 미리 fetch한 리그 데이터 (옵셔널)
 */
export function HomeClient({ initialData }: HomeClientProps = {}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const {
    allCompanies,
    isLoading,
    error,
    refresh,
  } = useLeagueData({
    refreshInterval: 20000,
    fallbackData: initialData ?? undefined,
  });
  const { submitVote, isLoading: isVoteLoading } = useVote();
  const {
    quota,
    useVote: consumeVote,
    refetchStats,
    isLoading: isQuotaLoading,
  } = useVoteQuota(user?.id);
  const [voteStates, setVoteStates] = useState<Record<string, HomeVoteState>>({});
  const feedbackTimersRef = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});

  const clearFeedbackTimer = useCallback((companyId: string) => {
    const timer = feedbackTimersRef.current[companyId];
    if (timer) {
      clearTimeout(timer);
      delete feedbackTimersRef.current[companyId];
    }
  }, []);

  const scheduleFeedbackReset = useCallback(
    (companyId: string) => {
      clearFeedbackTimer(companyId);
      feedbackTimersRef.current[companyId] = setTimeout(() => {
        setVoteStates((current) => {
          if (!current[companyId] || current[companyId].status === 'loading') {
            return current;
          }
          const next = { ...current };
          delete next[companyId];
          return next;
        });
        delete feedbackTimersRef.current[companyId];
      }, 1500);
    },
    [clearFeedbackTimer],
  );

  useEffect(() => {
    const timers = feedbackTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const handleDirectVote = useCallback(
    async (company: CompanyRanking) => {
      if (isAuthLoading || isQuotaLoading || isVoteLoading) return;

      const currentRemaining = Math.max(0, Math.floor(quota.remaining));
      const votePower = getHomeDirectVoteAmount(currentRemaining);

      if (votePower <= 0) {
        setVoteStates((current) => ({
          ...current,
          [company.companyId]: {
            status: 'exhausted',
            votes: 0,
            remaining: 0,
          },
        }));
        return;
      }

      clearFeedbackTimer(company.companyId);
      setVoteStates((current) => ({
        ...current,
        [company.companyId]: {
          status: 'loading',
          votes: votePower,
          remaining: currentRemaining,
        },
      }));

      const result = await submitVote({
        companyId: company.companyId,
        companyColor: company.gradientColor,
        userId: user?.id ?? null,
        votePower,
        voteSource: 'web',
        effects: false,
      });

      if (result?.success) {
        const consumed = getSuccessfulVoteScore(result.voteScore, votePower);
        const nextRemaining = getRemainingAfterVote(
          result.remaining,
          currentRemaining,
          consumed,
        );

        // 서버 성공 이후에만 클라이언트 quota를 소비합니다.
        consumeVote(consumed);
        if (user?.id) void refetchStats();

        setVoteStates((current) => ({
          ...current,
          [company.companyId]: {
            status: 'success',
            votes: consumed,
            remaining: nextRemaining,
          },
        }));

        // useVote의 SWR mutate와 함께 기존 홈 refresh 경로도 유지합니다.
        void refresh().catch(() => undefined);
        scheduleFeedbackReset(company.companyId);
        return;
      }

      if (user?.id) {
        void refetchStats();
      } else if (result?.remaining === 0 && currentRemaining > 0) {
        // 서버가 현재 잔여량을 0으로 판단한 경우 게스트 localStorage도 동기화합니다.
        consumeVote(currentRemaining);
      }

      const isExhausted =
        result?.remaining === 0 || result?.errorCode === 'RATE_LIMITED';
      setVoteStates((current) => ({
        ...current,
        [company.companyId]: {
          status: 'error',
          votes: 0,
          remaining: result?.remaining ?? currentRemaining,
          message: isExhausted
            ? '오늘 투표권을 모두 사용했어요.'
            : '투표에 실패했어요. 다시 눌러 주세요.',
        },
      }));
    },
    [
      clearFeedbackTimer,
      consumeVote,
      isAuthLoading,
      isQuotaLoading,
      isVoteLoading,
      quota.remaining,
      refetchStats,
      refresh,
      scheduleFeedbackReset,
      submitVote,
      user?.id,
    ],
  );

  if (isLoading && allCompanies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading company votes...</p>
      </div>
    );
  }

  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load company votes</p>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <HomeCompanyList
        companies={allCompanies}
        quotaRemaining={quota.remaining}
        isAuthLoading={isAuthLoading}
        isQuotaLoading={isQuotaLoading}
        isVoteLoading={isVoteLoading}
        voteStates={voteStates}
        onVote={handleDirectVote}
      />
    </div>
  );
}

export default HomeClient;
