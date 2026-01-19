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
 * - mutate('companies')를 호출하여 즉시 UI 반영
 */

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import confetti from 'canvas-confetti';
import { submitVote as submitVoteApi } from '@/lib/api';

export function useVote() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastVotedCompanyId, setLastVotedCompanyId] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const triggerGameEffects = (colorString: string) => {
    // Parse color or use default
    const color = colorString || '#FFD700'; // Default Gold

    // Confetti from bottom center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: [color, '#ffffff', '#FF5733'],
    });

    // Vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const submitVote = async (companyId: string, companyColor?: string) => {
    if (isLoading) return false;
    setIsLoading(true);
    try {
      // SSG/CSR 마이그레이션: Supabase 직접 호출
      const result = await submitVoteApi({ companyId });

      if (result.success) {
        setLastVotedCompanyId(companyId);
        triggerGameEffects(companyColor || '#FFD700');

        // 투표 성공 후 SWR 캐시 갱신하여 UI 즉시 반영
        // SSG/CSR 마이그레이션: key가 'companies'로 변경됨
        await mutate('companies');

        return true;
      } else {
        console.warn('[useVote] Vote failed:', result.message);
      }
    } catch (e) {
      console.error('[useVote] Error:', e);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  return { submitVote, isLoading, lastVotedCompanyId };
}
