/**
 * useVote 훅
 *
 * 투표 제출 및 UI 효과를 처리합니다.
 *
 * T1.29: 투표 성공 후 SWR 캐시 갱신 추가
 * - mutate('/api/companies')를 호출하여 즉시 UI 반영
 */

import { useState } from 'react';
import { useSWRConfig } from 'swr';
import confetti from 'canvas-confetti';

export function useVote() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastVotedCompanyId, setLastVotedCompanyId] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const triggerGameEffects = (colorString: string) => {
    // Parse color or use default
    const color = '#FFD700'; // Default Gold

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
      const res = await fetch('/api/vote', {
        method: 'POST',
        body: JSON.stringify({ companyId }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setLastVotedCompanyId(companyId);
        triggerGameEffects(companyColor || '#FFD700');

        // T1.29: 투표 성공 후 SWR 캐시 갱신하여 UI 즉시 반영
        // revalidate: true로 서버에서 최신 데이터를 다시 가져옴
        await mutate('/api/companies');

        return true;
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
