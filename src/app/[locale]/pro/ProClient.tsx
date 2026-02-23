/**
 * KCL Pro 구독 페이지 (Client Component)
 *
 * T2.02: KCL Pro 월정액 구독 UI
 *
 * 기능:
 * - 플랜 비교 (Free vs Pro)
 * - Lemon Squeezy Checkout Overlay 연동
 * - 이미 구독 중인 사용자에게 관리 페이지 표시
 * - 비로그인 사용자에게 로그인 유도
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Zap, Check, Crown, Shield, ArrowRight, Loader2 } from 'lucide-react';
import styles from './pro.module.scss';
import { FEATURES } from '@/config/features';

/** Lemon Squeezy 글로벌 타입 (lemon.js) */
declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
      Setup: (config: { eventHandler: (event: { event: string }) => void }) => void;
    };
  }
}

/**
 * Pro 페이지 클라이언트 컴포넌트
 */
export default function ProClient() {
  const t = useTranslations('Pro');
  const router = useRouter();

  // Pro 구독 기능이 비활성화되면 홈으로 리다이렉트
  if (!FEATURES.PRO_SUBSCRIPTION) {
    router.replace('/');
    return null;
  }
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isPro,
    subscription,
    createCheckoutUrl,
    customerPortalUrl,
    updatePaymentMethodUrl,
    renewsAt,
    endsAt,
    isLoading: subLoading,
    isCheckoutLoading,
    error,
  } = useSubscription();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  /**
   * 구독하기 버튼 핸들러
   * Lemon Squeezy Checkout Overlay를 오픈
   */
  const handleSubscribe = useCallback(async () => {
    setCheckoutError(null);

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const url = await createCheckoutUrl();
    if (!url) {
      setCheckoutError(error || 'Failed to create checkout');
      return;
    }

    // Lemon.js Overlay 오픈 시도
    if (window.LemonSqueezy?.Url?.Open) {
      window.LemonSqueezy.Url.Open(url);
    } else {
      // fallback: 새 탭에서 열기
      window.open(url, '_blank');
    }
  }, [isAuthenticated, createCheckoutUrl, error, router]);

  const isLoading = authLoading || subLoading;

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Loader2 className={styles.spinner} size={32} />
        </div>
      </div>
    );
  }

  // 이미 Pro 구독 중
  if (isPro && subscription) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Crown className={styles.crownIcon} size={40} />
          <h1 className={styles.title}>{t('active_title')}</h1>
          <p className={styles.subtitle}>{t('active_subtitle')}</p>
        </div>

        <div className={styles.activeCard}>
          <div className={styles.activeStatus}>
            <span className={styles.statusBadge}>{t('status_active')}</span>
            <span className={styles.planName}>KCL Pro</span>
          </div>

          <div className={styles.activeDetails}>
            {renewsAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t('next_billing')}</span>
                <span className={styles.detailValue}>
                  {new Date(renewsAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {endsAt && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>{t('ends_at')}</span>
                <span className={styles.detailValue}>
                  {new Date(endsAt).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>{t('monthly_votes')}</span>
              <span className={styles.detailValue}>300 {t('votes_per_month')}</span>
            </div>
          </div>

          <div className={styles.activeActions}>
            {updatePaymentMethodUrl && (
              <a
                href={updatePaymentMethodUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryButton}
              >
                {t('update_payment')}
              </a>
            )}
            {customerPortalUrl && (
              <a
                href={customerPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryButton}
              >
                {t('manage_subscription')}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 비구독 상태: 업그레이드 UI
  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <Zap className={styles.zapIcon} size={40} />
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </div>

      {/* 플랜 비교 */}
      <div className={styles.plans}>
        {/* Free 플랜 */}
        <div className={styles.planCard}>
          <div className={styles.planHeader}>
            <h3 className={styles.planName}>Free</h3>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>$0</span>
              <span className={styles.pricePeriod}>/{t('month')}</span>
            </div>
          </div>
          <ul className={styles.planFeatures}>
            <li>
              <Check size={16} />
              <span>{t('free_votes')}</span>
            </li>
            <li>
              <Check size={16} />
              <span>{t('free_power_vote')}</span>
            </li>
            <li>
              <Check size={16} />
              <span>{t('free_ranking')}</span>
            </li>
          </ul>
        </div>

        {/* Pro 플랜 */}
        <div className={`${styles.planCard} ${styles.proPlan}`}>
          <div className={styles.proBadge}>{t('recommended')}</div>
          <div className={styles.planHeader}>
            <h3 className={styles.planName}>
              <Crown size={20} />
              KCL Pro
            </h3>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>$1.99</span>
              <span className={styles.pricePeriod}>/{t('month')}</span>
            </div>
          </div>
          <ul className={styles.planFeatures}>
            <li className={styles.highlight}>
              <Check size={16} />
              <span>{t('pro_votes')}</span>
            </li>
            <li>
              <Check size={16} />
              <span>{t('pro_power_vote')}</span>
            </li>
            <li>
              <Check size={16} />
              <span>{t('pro_ranking')}</span>
            </li>
          </ul>

          {/* 구독 버튼 */}
          <button
            className={styles.subscribeButton}
            onClick={handleSubscribe}
            disabled={isCheckoutLoading}
          >
            {isCheckoutLoading ? (
              <Loader2 className={styles.spinner} size={20} />
            ) : (
              <>
                {isAuthenticated ? t('subscribe_cta') : t('login_to_subscribe')}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {checkoutError && <p className={styles.errorText}>{checkoutError}</p>}
        </div>
      </div>

      {/* 보안 안내 */}
      <div className={styles.footer}>
        <Shield size={16} />
        <span>{t('secure_payment')}</span>
      </div>
    </div>
  );
}
