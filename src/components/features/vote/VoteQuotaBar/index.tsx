/**
 * VoteQuotaBar
 *
 * 투표권 상태 표시 컴포넌트
 * 일일 투표권 사용량과 남은 투표권을 시각화합니다.
 *
 * 색상 규칙:
 * - 여유 (21~30): Green (#10B981)
 * - 주의 (11~20): Yellow (#F59E0B)
 * - 경고 (1~10): Red (#EF4444)
 * - 소진 (0): Gray (#6B7280)
 */

'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Ticket, Clock, Moon, Crown } from 'lucide-react';
import classNames from 'classnames';
import Link from 'next/link';
import { FEATURES } from '@/config/features';
import styles from './VoteQuotaBar.module.scss';

export interface VoteQuotaBarProps {
  /** 사용한 투표권 수 */
  used: number;
  /** 최대 투표권 (비로그인 30, 로그인 60) */
  max: number;
  /** 리셋까지 남은 시간 (시간) */
  hoursUntilReset?: number;
  /** 리셋까지 남은 시간 (분) */
  minutesUntilReset?: number;
  /** 표시 변형 - PC: full, Mobile: compact */
  variant?: 'full' | 'compact';
  /** 투표 모드 */
  mode?: 'daily';
  /** 로그인 여부 */
  isLoggedIn?: boolean;
  /** Pro 구독 여부 (true면 업셀링 숨김) */
  isPro?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 남은 투표권에 따른 색상 레벨 반환
 * max 기준으로 비율 계산하여 모드(30/60)에 관계없이 일관된 표시
 */
function getQuotaLevel(remaining: number, max: number): 'plenty' | 'caution' | 'warning' | 'exhausted' {
  if (remaining === 0) return 'exhausted';
  const ratio = remaining / max;
  if (ratio <= 0.17) return 'warning';   // ~17% 이하
  if (ratio <= 0.5) return 'caution';    // ~50% 이하
  return 'plenty';
}

/**
 * 투표권 상태 표시 컴포넌트
 */
function VoteQuotaBar({
  used,
  max,
  hoursUntilReset = 0,
  minutesUntilReset = 0,
  variant = 'full',
  isLoggedIn = false,
  isPro = false,
  className,
}: VoteQuotaBarProps) {
  const t = useTranslations('Vote');
  const tPro = useTranslations('Pro');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  const remaining = max - used;
  const progress = (used / max) * 100;
  const level = getQuotaLevel(remaining, max);
  const isExhausted = remaining === 0;

  // 컴팩트 모드 (모바일)
  if (variant === 'compact') {
    return (
      <div className={classNames(styles.quotaBarCompact, styles[level], className)}>
        <div className={styles.compactRow}>
          <Ticket size={14} className={styles.icon} />
          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className={styles.compactCount}>
            {remaining}/{max}
          </span>
          {isExhausted ? (
            <Moon size={12} className={styles.resetIcon} />
          ) : (
            <Clock size={12} className={styles.resetIcon} />
          )}
        </div>
      </div>
    );
  }

  // 풀 모드 (PC)
  return (
    <div className={classNames(styles.quotaBar, styles[level], className)}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <Ticket size={16} className={styles.icon} />
          <span className={styles.title}>{t('quota.title')}</span>
        </div>
        <span className={styles.count}>
          {remaining}/{max}
        </span>
      </div>

      {/* 진행률 바 */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* 안내 메시지 */}
      <div className={styles.hint}>
        {isExhausted ? (
          <>
            <Moon size={14} className={styles.hintIcon} />
            <div className={styles.exhaustedMessage}>
              <span className={styles.exhaustedTitle}>{t('quota.exhausted_title')}</span>
              <span className={styles.countdown}>
                {t('quota.reset_countdown', { hours: hoursUntilReset })}
              </span>
            </div>
          </>
        ) : (
          <>
            <Clock size={14} className={styles.hintIcon} />
            <span>{t('quota.reset_countdown', { hours: hoursUntilReset })}</span>
          </>
        )}
      </div>

      {/* Pro 업셀링: 로그인 Free 사용자에게만 표시 */}
      {FEATURES.PRO_SUBSCRIPTION && isLoggedIn && !isPro && (
        <Link href={`/${locale}/pro`} className={styles.proUpsell}>
          <Crown size={14} className={styles.proUpsellIcon} />
          <span>{tPro('upgrade_cta')}</span>
          <span className={styles.proUpsellDesc}>{tPro('upgrade_desc')}</span>
        </Link>
      )}
    </div>
  );
}

export default memo(VoteQuotaBar);
