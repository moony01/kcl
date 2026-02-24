/**
 * KCL Pro 구독 페이지 (Client Component)
 *
 * T2.02: KCL Pro 월정액 구독 UI
 *
 * 기능:
 * - 플랜 비교 (Free vs Pro)
 * - Buy Me a Coffee 멤버십 페이지 연동
 * - 이미 구독 중인 사용자에게 관리 페이지 표시
 * - 비로그인 사용자에게 로그인 유도
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Zap, Check, Crown, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { BMC_MEMBERSHIP_URL } from '@/lib/constants';
import styles from './pro.module.scss';
import { FEATURES } from '@/config/features';

/**
 * Pro 페이지 클라이언트 컴포넌트
 */
export default function ProClient() {
  const t = useTranslations('Pro');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    if (!FEATURES.PRO_SUBSCRIPTION) {
      router.replace(`/${locale}`);
    }
  }, [router, locale]);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    isPro,
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
   * Buy Me a Coffee 멤버십 페이지를 오픈
   */
  const handleSubscribe = useCallback(async () => {
    setCheckoutError(null);

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    const url = await createCheckoutUrl();
    if (!url) {
      setCheckoutError(error || 'Failed to open membership page');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }, [isAuthenticated, createCheckoutUrl, error, router, locale]);

  const isLoading = authLoading || subLoading;
  const hasPortalLinks = !!updatePaymentMethodUrl || !!customerPortalUrl;

  if (!FEATURES.PRO_SUBSCRIPTION) {
    return null;
  }

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
  if (isPro) {
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
            {!hasPortalLinks && (
              <a
                href={BMC_MEMBERSHIP_URL}
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
              <span className={styles.priceAmount}>$5</span>
              <span className={styles.pricePeriod}>/{t('month')}</span>
            </div>
            <div className={styles.planPriceAnnual}>
              <span className={styles.priceAmountAnnual}>$48</span>
              <span className={styles.pricePeriodAnnual}>/yr</span>
              <span className={styles.discountBadge}>Save 20%</span>
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
            type="button"
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
