/**
 * Fan Power Pass 구독 페이지 (Client Component)
 *
 * 기능:
 * - 플랜 비교 (Free vs Pro)
 * - Buy Me a Coffee 멤버십 페이지 연동
 * - 이미 구독 중인 사용자에게 관리 페이지 표시
 * - 비로그인 사용자에게 로그인 유도
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Zap, Check, Crown, Shield, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
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

  const { user, isAuthenticated, isLoading: authLoading, refreshProfile } = useAuth();
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
    refetch,
  } = useSubscription();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);
  const [agreeActivationDelay, setAgreeActivationDelay] = useState(false);
  const [agreeEmailMatch, setAgreeEmailMatch] = useState(false);

  const check1Ref = useRef<HTMLLabelElement>(null);
  const check2Ref = useRef<HTMLLabelElement>(null);
  const copyBoxRef = useRef<HTMLDivElement>(null);

  const [check1Error, setCheck1Error] = useState(false);
  const [check2Error, setCheck2Error] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isPendingActivation, setIsPendingActivation] = useState(false);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // isPendingActivation 시 폴링 시작, isPro 되면 자동 해제
  useEffect(() => {
    if (!isPendingActivation) {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      return;
    }

    // 5초마다 구독 상태 재조회
    pollingIntervalRef.current = setInterval(() => {
      refetch(true);
      refreshProfile();
    }, 5000);

    // 10분 타임아웃 — 결제 안 한 경우 배너 해제
    pendingTimerRef.current = setTimeout(() => {
      setIsPendingActivation(false);
    }, 10 * 60 * 1000);

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, [isPendingActivation, refetch, refreshProfile]);

  // isPro로 전환되면 폴링 중단 + 배너 해제
  useEffect(() => {
    if (isPro && isPendingActivation) {
      setIsPendingActivation(false);
    }
  }, [isPro, isPendingActivation]);

  const isValidEmailFormat = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const currentUserEmail = user?.email?.trim().toLowerCase() || '';

  const handleCopyEmail = useCallback(async () => {
    setCheckoutError(null);

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (!currentUserEmail) {
      setCheckoutError(t('checkout_email_required'));
      setCopyStatus('error');
      return;
    }

    if (!isValidEmailFormat(currentUserEmail)) {
      setCheckoutError(t('checkout_email_invalid'));
      setCopyStatus('error');
      return;
    }

    try {
      await navigator.clipboard.writeText(currentUserEmail);
      setCopyStatus('success');
      setHasCopiedEmail(true);
    } catch {
      setCopyStatus('error');
      setHasCopiedEmail(false);
      setCheckoutError(t('copy_email_failed'));
    }
  }, [isAuthenticated, currentUserEmail, isValidEmailFormat, router, locale, t]);

  /**
   * 구독하기 버튼 핸들러
   * Buy Me a Coffee 멤버십 페이지를 오픈
   */
  const handleSubscribe = useCallback(async () => {
    setCheckoutError(null);
    setCheck1Error(false);
    setCheck2Error(false);
    setCopyError(false);

    if (!isAuthenticated) {
      router.push(`/${locale}/login`);
      return;
    }

    if (!agreeActivationDelay) {
      setCheck1Error(true);
      check1Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!agreeEmailMatch) {
      setCheck2Error(true);
      check2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!hasCopiedEmail) {
      setCopyError(true);
      copyBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!currentUserEmail) {
      setCheckoutError(t('checkout_email_required'));
      return;
    }

    if (!isValidEmailFormat(currentUserEmail)) {
      setCheckoutError(t('checkout_email_invalid'));
      return;
    }

    if (!user?.email_confirmed_at) {
      setCheckoutError(t('checkout_email_unverified'));
      return;
    }

    const url = await createCheckoutUrl();
    if (!url) {
      setCheckoutError(error || 'Failed to open membership page');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    setIsPendingActivation(true);
  }, [
    isAuthenticated,
    currentUserEmail,
    user,
    isValidEmailFormat,
    hasCopiedEmail,
    agreeActivationDelay,
    agreeEmailMatch,
    createCheckoutUrl,
    error,
    router,
    locale,
    t,
  ]);

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
      <div className={styles.successPage}>
        <section className={styles.successHero}>
          <div className={styles.successIconWrap}>
            <Crown size={34} className={styles.successCrownIcon} />
            <CheckCircle2 size={24} className={styles.successCheckIcon} />
          </div>

          <p className={styles.successKicker}>
            <Sparkles size={14} />
            {t('success_kicker')}
          </p>
          <h1 className={styles.successTitle}>{t('active_title')}</h1>
          <p className={styles.successDescription}>{t('active_subtitle')}</p>
        </section>

        <section className={styles.successActiveCard}>
          <div className={styles.successCardTop}>
            <div>
              <p className={styles.successCardBadge}>{t('success_active_badge')}</p>
              <h2 className={styles.successCardTitle}>{t('success_card_title')}</h2>
              <p className={styles.successCardDesc}>{t('success_card_desc')}</p>
            </div>
            <div className={styles.successCardStatus}>{t('status_active')}</div>
          </div>

          <div className={styles.successMetrics}>
            <article className={styles.successMetricItem}>
              <p>{t('monthly_votes')}</p>
              <strong>
                300 <span>{t('votes_per_month')}</span>
              </strong>
            </article>
            <article className={styles.successMetricItem}>
              <p>{t('benefit_power_vote_title')}</p>
              <strong>x50</strong>
            </article>
            <article className={styles.successMetricItem}>
              <p>{t('benefit_ranking_title')}</p>
              <strong>{t('benefit_ranking_value')}</strong>
            </article>
          </div>

          {(hasPortalLinks || true) && (
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
          )}
        </section>

        <section className={styles.successBenefitsSection}>
          <div className={styles.successSectionHeader}>
            <h3>{t('benefits_title')}</h3>
            <p>{t('benefits_desc')}</p>
          </div>

          <div className={styles.successBenefitsGrid}>
            <article className={styles.successBenefitCard}>
              <h4>{t('pro_votes')}</h4>
              <p>{t('benefit_daily_votes_desc')}</p>
            </article>
            <article className={styles.successBenefitCard}>
              <h4>{t('pro_power_vote')}</h4>
              <p>{t('benefit_power_vote_desc')}</p>
            </article>
            <article className={styles.successBenefitCard}>
              <h4>{t('pro_ranking')}</h4>
              <p>{t('benefit_ranking_desc')}</p>
            </article>
          </div>
        </section>

        <section className={styles.successNextSection}>
          <div className={styles.successSectionHeader}>
            <h3>{t('whats_next_title')}</h3>
            <p>{t('whats_next_desc')}</p>
          </div>

          <div className={styles.successNextSteps}>
            <div className={styles.successStepItem}>
              <span>01</span>
              <div>
                <strong>{t('next_step_vote_title')}</strong>
                <p>{t('next_step_vote_desc')}</p>
              </div>
            </div>
            <div className={styles.successStepItem}>
              <span>02</span>
              <div>
                <strong>{t('next_step_power_title')}</strong>
                <p>{t('next_step_power_desc')}</p>
              </div>
            </div>
            <div className={styles.successStepItem}>
              <span>03</span>
              <div>
                <strong>{t('next_step_rank_title')}</strong>
                <p>{t('next_step_rank_desc')}</p>
              </div>
            </div>
          </div>

          <button type="button" onClick={() => router.push(`/${locale}`)} className={styles.successCta}>
            {t('go_vote')}
            <ArrowRight size={18} />
          </button>
        </section>
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

      <div className={styles.bmcGuideSection}>
        <div className={styles.bmcGuideFrame}>
          <img
            src="/images/pro/Group 44.png"
            alt={t('bmc_guide_image_alt')}
            className={styles.bmcGuideImage}
            loading="lazy"
          />
          <div className={styles.bmcGuideEmailBorder} aria-hidden="true" />
          <div className={styles.bmcGuideOverlay}>
            {t.rich('bmc_guide_overlay_html', {
              strong: (chunks) => <strong>{chunks}</strong>,
              br: () => <br />,
            })}
          </div>
        </div>

        <p className={styles.bmcGuideHeadline}>
          {t.rich('bmc_guide_headline_html', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>

        <div className={styles.bmcGuideNotes}>
          <label
            ref={check1Ref}
            className={`${styles.noticeCheckItem}${check1Error ? ` ${styles.noticeCheckItemError}` : ''}`}
          >
            <input
              type="checkbox"
              checked={agreeActivationDelay}
              onChange={(e) => { setAgreeActivationDelay(e.target.checked); if (e.target.checked) setCheck1Error(false); }}
            />
            <span>
              {t.rich('activation_delay', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </label>
          {check1Error && <p className={styles.inlineError}>{t('checkout_notice_required')}</p>}
          <label
            ref={check2Ref}
            className={`${styles.noticeCheckItem}${check2Error ? ` ${styles.noticeCheckItemError}` : ''}`}
          >
            <input
              type="checkbox"
              checked={agreeEmailMatch}
              onChange={(e) => { setAgreeEmailMatch(e.target.checked); if (e.target.checked) setCheck2Error(false); }}
            />
            <span>
              {t.rich('bmc_email_match_notice', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </label>
          {check2Error && <p className={styles.inlineError}>{t('checkout_notice_required')}</p>}
        </div>
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
        <div className={`${styles.planCard} ${styles.proPlan}${isPendingActivation ? ` ${styles.proPlanPending}` : ''}`}>
          <div className={styles.proBadge}>{t('recommended')}</div>
          <div className={styles.planHeader}>
            <h3 className={styles.planName}>
              <Crown size={20} />
              Fan Power Pass
            </h3>
            <div className={styles.planPrice}>
              <span className={styles.priceAmount}>$5</span>
              <span className={styles.pricePeriod}>/{t('month')}</span>
            </div>
            <div className={styles.planPriceAnnual}>
              <span className={styles.priceAmountAnnual}>$48</span>
              <span className={styles.pricePeriodAnnual}>{t('year')}</span>
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

          <div ref={copyBoxRef} className={`${styles.linkBox}${copyError ? ` ${styles.linkBoxError}` : ''}`}>
            <p className={styles.linkTitle}>{t('copy_email_title')}</p>
            <p className={styles.linkDesc}>{t('copy_email_desc')}</p>
            <div className={styles.linkRow}>
              <input
                type="email"
                value={currentUserEmail}
                readOnly
                placeholder={t('copy_email_placeholder')}
                className={styles.linkInput}
                disabled={!isAuthenticated}
              />
              <button
                type="button"
                className={styles.linkButton}
                onClick={handleCopyEmail}
                disabled={!isAuthenticated || !currentUserEmail}
              >
                {t('copy_email_button')}
              </button>
            </div>
            {copyStatus === 'success' && <p className={styles.linkStatus}>{t('copy_email_success')}</p>}
            {copyError && <p className={styles.inlineError}>{t('copy_email_required')}</p>}
          </div>

          {/* 구독 버튼 */}
          <button
            type="button"
            className={styles.subscribeButton}
            onClick={handleSubscribe}
            disabled={isCheckoutLoading || isPendingActivation}
          >
            {isCheckoutLoading ? (
              <Loader2 className={styles.spinner} size={20} />
            ) : isPendingActivation ? (
              <>
                <Loader2 className={styles.spinner} size={20} />
                {t('pending_activation_button')}
              </>
            ) : (
              <>
                {isAuthenticated ? t('subscribe_cta') : t('login_to_subscribe')}
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {isPendingActivation && (
            <div className={styles.pendingBanner}>
              <Loader2 className={styles.pendingSpinner} size={16} />
              <span>{t('pending_activation_banner')}</span>
            </div>
          )}

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
