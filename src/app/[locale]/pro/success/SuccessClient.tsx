/**
 * 결제 성공 클라이언트 컴포넌트
 *
 * 결제 완료 축하 메시지 및 홈으로 이동 안내
 * 멤버십 동기화(Webhook)까지 약간의 딜레이가 있을 수 있어서
 * 구독 상태를 폴링하여 활성화 확인
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSubscription } from '@/hooks/useSubscription';
import { Crown, ArrowRight, Loader2 } from 'lucide-react';

export default function SuccessClient() {
  const t = useTranslations('Pro');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const { isPro, refetch } = useSubscription();
  const [pollCount, setPollCount] = useState(0);

  /**
   * Webhook 처리 완료 대기 (최대 30초, 3초 간격)
   */
  useEffect(() => {
    if (isPro || pollCount >= 10) return;

    const timer = setTimeout(async () => {
      await refetch();
      setPollCount((prev) => prev + 1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isPro, pollCount, refetch]);

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '3rem 1rem',
        textAlign: 'center',
      }}
    >
      <Crown size={56} color="#f59e0b" style={{ marginBottom: '1rem' }} />

      <h1
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #8b5cf6, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.75rem',
        }}
      >
        {t('success_title')}
      </h1>

      <p
        style={{
          color: 'var(--color-text-secondary, #9ca3af)',
          fontSize: '1rem',
          marginBottom: '2rem',
          lineHeight: 1.6,
        }}
      >
        {t('success_desc')}
      </p>

      {!isPro && pollCount < 10 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-secondary, #9ca3af)',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>{t('activating')}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push(`/${locale}`)}
        style={{
          padding: '0.875rem 2rem',
          border: 'none',
          borderRadius: 12,
          fontSize: '1rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: '#fff',
          transition: 'opacity 0.2s',
        }}
      >
        {t('go_vote')}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
