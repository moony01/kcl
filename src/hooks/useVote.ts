/**
 * useVote 훅
 *
 * 투표 제출 및 UI 효과를 처리합니다.
 *
 * SSG/CSR 마이그레이션:
 * - 기존: fetch('/api/vote') → API Routes 경유
 * - 변경: submitVote() → Supabase 직접 호출
 *
 * T1.29: 투표 성공 후 SWR 캐시 갱신 추가
 * T1.85: 로그인 사용자 userId/votePower 지원 추가
 */

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import confetti from 'canvas-confetti';
import { submitVote as submitVoteApi } from '@/lib/api';
import { VOTE_LIMITS } from '@/config/vote';
import type { VoteResult } from '@/lib/api';

/** submitVote 호출 시 전달할 옵션 */
interface SubmitVoteOptions {
  /** 소속사 ID */
  companyId: string;
  /** 소속사 컬러 (confetti용) */
  companyColor?: string;
  /** 로그인 사용자 ID (선택) */
  userId?: string | null;
  /** 파워투표 점수 (1~100, 기본값 1) */
  votePower?: number;
  /** Surface-specific server policy. */
  voteSource?: 'web' | 'kpopface_embed';
  /** 홈처럼 최소 피드백만 필요한 표면은 confetti/vibration을 생략합니다. */
  effects?: boolean;
}

export function useVote() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastVotedCompanyId, setLastVotedCompanyId] = useState<string | null>(null);
  /** 마지막 투표 결과 (파워투표 점수 표시용) */
  const [lastVoteResult, setLastVoteResult] = useState<VoteResult | null>(null);
  const { mutate } = useSWRConfig();

  const triggerGameEffects = (colorString: string, votePower: number) => {
    const color = colorString || '#FFD700';

    // 파워투표일수록 파티클 많고 퍼짐 넓음
    confetti({
      particleCount: 60 + votePower * 20,
      spread: 50 + votePower * 10,
      origin: { y: 0.8 },
      colors: [color, '#ffffff', '#FF5733'],
    });

    // 진동: 파워투표일수록 강하게
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30 + votePower * 10);
    }
  };

  /**
   * 투표 제출
   *
   * @param options - 투표 옵션 (companyId 필수, userId/votePower 선택)
   * @returns 성공 시 VoteResult, 실패 시 null
   */
  const submitVote = async (options: SubmitVoteOptions): Promise<VoteResult | null> => {
    if (isLoading) return null;
    setIsLoading(true);

    const {
      companyId,
      companyColor,
      userId,
      votePower = 1,
      voteSource = 'web',
      effects = true,
    } = options;
    const maxVotePower = voteSource === 'kpopface_embed'
      ? VOTE_LIMITS.KPOPFACE_EMBED_POWER_MAX
      : VOTE_LIMITS.POWER_MAX;
    const normalizedVotePower = Math.min(Math.max(Math.floor(votePower), 1), maxVotePower);

    try {
      const result = await submitVoteApi({
        companyId,
        userId: userId || null,
        votePower: normalizedVotePower,
        voteSource,
      });

      if (result.success) {
        setLastVotedCompanyId(companyId);
        setLastVoteResult(result);
        if (effects) {
          triggerGameEffects(companyColor || '#FFD700', normalizedVotePower);
        }

        // The RPC result is authoritative. Refreshing the ranking cache is a
        // follow-up and must not turn a successful vote into a failed one.
        try {
          void Promise.resolve(mutate('companies')).catch((error: unknown) => {
            console.warn('[useVote] Failed to refresh companies after vote:', error);
          });
        } catch (error: unknown) {
          console.warn('[useVote] Failed to refresh companies after vote:', error);
        }

        return result;
      } else {
        console.warn('[useVote] Vote failed:', result.message);
        setLastVoteResult(result);
        return result;
      }
    } catch (e) {
      console.error('[useVote] Error:', e);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  return { submitVote, isLoading, lastVotedCompanyId, lastVoteResult };
}
