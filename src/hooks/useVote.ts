import { useState } from 'react';
import confetti from 'canvas-confetti';

export function useVote() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastVotedCompanyId, setLastVotedCompanyId] = useState<string | null>(null);

  const triggerGameEffects = (colorString: string) => {
    // Parse color or use default
    const color = '#FFD700'; // Default Gold

    // Confetti from bottom center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: [color, '#ffffff', '#FF5733']
    });

    // Vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const submitVote = async (companyId: string, companyColor?: string) => {
    if (isLoading) return;
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
        return true;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  return { submitVote, isLoading, lastVotedCompanyId };
}
