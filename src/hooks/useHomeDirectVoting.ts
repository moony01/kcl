'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CompanyRanking } from '@/types/league';
import type {
  VotePolicyStatus,
  VoteSource,
} from '@/components/features/VoteController/votePolicy';
import { useAuth } from '@/hooks/useAuth';
import { useVote } from '@/hooks/useVote';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import {
  getDirectVoteAmount,
  getRemainingAfterVote,
  getSuccessfulVoteScore,
  HOME_DIRECT_VOTE_UNIT,
} from '@/lib/home-vote';
import type { HomeVoteState } from '@/components/features/home/HomeCompanyList';

export interface HomeDirectVotingPolicy {
  voteSource?: VoteSource;
  guestDailyLimit?: number;
  storageKey?: string;
  voteUnit?: number;
  maxVotePower?: number;
  readStatus?: (userId?: string | null) => Promise<VotePolicyStatus | null>;
  effects?: boolean;
  onVoteSuccess?: (company: CompanyRanking, votes: number) => void;
  onQuotaExhausted?: () => void;
}

export interface UseHomeDirectVotingOptions {
  refresh: () => unknown;
  policy?: HomeDirectVotingPolicy;
}

export interface UseHomeDirectVotingResult {
  quota: ReturnType<typeof useVoteQuota>['quota'];
  isAuthLoading: boolean;
  isQuotaLoading: boolean;
  isVoteLoading: boolean;
  voteStates: Record<string, HomeVoteState>;
  onVote: (company: CompanyRanking) => void;
}

/**
 * Shared direct-card behavior for the main home board and iframe surfaces.
 * The visual board is shared separately through HomeCompanyList; keeping the
 * submission path here prevents the surfaces from drifting again.
 */
export function useHomeDirectVoting({
  refresh,
  policy = {},
}: UseHomeDirectVotingOptions): UseHomeDirectVotingResult {
  const voteSource = policy.voteSource ?? 'web';
  const voteUnit = policy.voteUnit ?? HOME_DIRECT_VOTE_UNIT;
  const maxVotePower = policy.maxVotePower;
  const readStatus = policy.readStatus;
  const effects = policy.effects ?? false;
  const onVoteSuccess = policy.onVoteSuccess;
  const onQuotaExhausted = policy.onQuotaExhausted;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { submitVote, isLoading: isVoteLoading } = useVote();
  const {
    quota,
    useVote: consumeVote,
    refetchStats,
    isLoading: isQuotaLoading,
  } = useVoteQuota(user?.id, {
    guestDailyLimit: policy.guestDailyLimit,
    storageKey: policy.storageKey,
  });
  const [policyStatus, setPolicyStatus] = useState<VotePolicyStatus | null>(null);
  const [isPolicyLoading, setIsPolicyLoading] = useState(Boolean(readStatus));
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

  const refreshPolicyStatus = useCallback(async () => {
    if (!readStatus) {
      setPolicyStatus(null);
      setIsPolicyLoading(false);
      return null;
    }

    setIsPolicyLoading(true);
    try {
      const nextStatus = await readStatus(user?.id);
      setPolicyStatus(nextStatus);
      return nextStatus;
    } catch {
      setPolicyStatus(null);
      return null;
    } finally {
      setIsPolicyLoading(false);
    }
  }, [readStatus, user?.id]);

  useEffect(() => {
    let cancelled = false;

    if (!readStatus || isAuthLoading) {
      setPolicyStatus(null);
      setIsPolicyLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsPolicyLoading(true);
    void readStatus(user?.id)
      .then((nextStatus) => {
        if (!cancelled) setPolicyStatus(nextStatus);
      })
      .catch(() => {
        if (!cancelled) setPolicyStatus(null);
      })
      .finally(() => {
        if (!cancelled) setIsPolicyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, readStatus, user?.id]);

  const effectiveRemaining = policyStatus?.remaining ?? quota.remaining;
  const effectiveQuota = policyStatus
    ? {
        ...quota,
        used: Math.max(quota.max - effectiveRemaining, 0),
        remaining: effectiveRemaining,
        canVote: policyStatus.canVote && effectiveRemaining > 0,
      }
    : quota;
  const effectiveVoteUnit = Math.min(
    voteUnit,
    Math.max(1, Math.floor(maxVotePower ?? Number.POSITIVE_INFINITY)),
  );
  const effectiveIsQuotaLoading = isQuotaLoading || isPolicyLoading;

  const handleDirectVote = useCallback(
    async (company: CompanyRanking) => {
      if (isAuthLoading || effectiveIsQuotaLoading || isVoteLoading) return;

      const currentRemaining = Math.max(0, Math.floor(effectiveRemaining));
      const votePower = getDirectVoteAmount(currentRemaining, effectiveVoteUnit);

      if (votePower <= 0) {
        setVoteStates((current) => ({
          ...current,
          [company.companyId]: {
            status: 'exhausted',
            votes: 0,
            remaining: 0,
          },
        }));
        onQuotaExhausted?.();
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

      let result: Awaited<ReturnType<typeof submitVote>> = null;
      try {
        result = await submitVote({
          companyId: company.companyId,
          companyColor: company.gradientColor,
          userId: user?.id ?? null,
          votePower,
          voteSource,
          effects,
        });
      } catch {
        // Keep the card in an explicit error state even if a caller-provided
        // submit adapter rejects before returning a VoteResult.
      }

      if (result?.success) {
        const consumed = getSuccessfulVoteScore(result.voteScore, votePower);
        const nextRemaining = getRemainingAfterVote(
          result.remaining,
          currentRemaining,
          consumed,
        );

        consumeVote(consumed);
        if (user?.id) void refetchStats();
        if (policyStatus) {
          const nextPolicyRemaining = Math.max(0, nextRemaining);
          setPolicyStatus((current) => current && {
            ...current,
            canVote: current.canVote && nextPolicyRemaining > 0,
            hasUsedEmbed: current.hasUsedEmbed === undefined
              ? current.hasUsedEmbed
              : nextPolicyRemaining <= 0,
            remaining: nextPolicyRemaining,
            maxVotePower: Math.min(current.maxVotePower, nextPolicyRemaining),
          });
        }

        setVoteStates((current) => ({
          ...current,
          [company.companyId]: {
            status: 'success',
            votes: consumed,
            remaining: nextRemaining,
          },
        }));

        scheduleFeedbackReset(company.companyId);
        onVoteSuccess?.(company, consumed);

        // Do not make the feedback lifetime depend on SWR/network latency.
        try {
          void Promise.resolve(refresh()).catch(() => undefined);
        } catch {
          // The vote already succeeded; a synchronous refresh failure is harmless.
        }
        return;
      }

      if (user?.id) {
        void refetchStats();
      } else if (result?.remaining === 0 && currentRemaining > 0) {
        consumeVote(currentRemaining);
      }

      const isEmbedLimit = result?.errorCode === 'EMBED_DAILY_LIMIT';
      const isExhausted =
        isEmbedLimit || result?.remaining === 0 || result?.errorCode === 'RATE_LIMITED';
      setVoteStates((current) => ({
        ...current,
        [company.companyId]: {
          status: 'error',
          votes: 0,
          remaining: result?.remaining ?? currentRemaining,
        },
      }));
      if (isEmbedLimit) void refreshPolicyStatus();
      if (isExhausted) onQuotaExhausted?.();
    },
    [
      clearFeedbackTimer,
      consumeVote,
      isAuthLoading,
      effectiveIsQuotaLoading,
      effectiveRemaining,
      effectiveVoteUnit,
      isVoteLoading,
      effects,
      policyStatus,
      onQuotaExhausted,
      onVoteSuccess,
      refetchStats,
      refresh,
      refreshPolicyStatus,
      scheduleFeedbackReset,
      submitVote,
      user?.id,
      voteSource,
    ],
  );

  return {
    quota: effectiveQuota,
    isAuthLoading,
    isQuotaLoading: effectiveIsQuotaLoading,
    isVoteLoading,
    voteStates,
    onVote: (company) => void handleDirectVote(company),
  };
}

export { HOME_DIRECT_VOTE_UNIT, getDirectVoteAmount } from '@/lib/home-vote';

export default useHomeDirectVoting;
