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
import { Crown, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import styles from '../pro.module.scss';

export default function SuccessClient() {
  const t = useTranslations('Pro');
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const { isPro, refetch } = useSubscription();
  const [pollCount, setPollCount] = useState(0);
  const confettiPieces = Array.from({ length: 14 }, (_, index) => index + 1);

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
    <div className={styles.successPage}>
      <div className={styles.successConfetti} aria-hidden="true">
        {confettiPieces.map((piece) => (
          <span key={piece} className={styles.confettiPiece} />
        ))}
      </div>

      <section className={styles.successHero}>
        <div className={styles.successIconWrap}>
          <Crown size={34} className={styles.successCrownIcon} />
          <CheckCircle2 size={24} className={styles.successCheckIcon} />
        </div>

        <p className={styles.successKicker}>
          <Sparkles size={14} />
          {t('success_kicker')}
        </p>
        <h1 className={styles.successTitle}>{t('success_title')}</h1>
        <p className={styles.successDescription}>{t('success_desc')}</p>

        {!isPro && pollCount < 10 && (
          <div className={styles.successActivation}>
            <Loader2 size={16} className={styles.pendingSpinner} />
            <span>{t('activating')}</span>
          </div>
        )}
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
