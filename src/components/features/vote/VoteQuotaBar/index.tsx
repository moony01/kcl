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
import { Ticket, Clock, Moon } from 'lucide-react';
import classNames from 'classnames';
import styles from './VoteQuotaBar.module.scss';

export interface VoteQuotaBarProps {
  /** 사용한 투표권 수 (0~30) */
  used: number;
  /** 최대 투표권 (기본 30) */
  max: number;
  /** 리셋까지 남은 시간 (시간) */
  hoursUntilReset?: number;
  /** 리셋까지 남은 시간 (분) */
  minutesUntilReset?: number;
  /** 표시 변형 - PC: full, Mobile: compact */
  variant?: 'full' | 'compact';
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 남은 투표권에 따른 색상 레벨 반환
 */
function getQuotaLevel(remaining: number): 'plenty' | 'caution' | 'warning' | 'exhausted' {
  if (remaining === 0) return 'exhausted';
  if (remaining <= 10) return 'warning';
  if (remaining <= 20) return 'caution';
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
  className,
}: VoteQuotaBarProps) {
  const t = useTranslations('Vote');

  const remaining = max - used;
  const progress = (used / max) * 100;
  const level = getQuotaLevel(remaining);
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
                {t('quota.exhausted_countdown', {
                  hours: hoursUntilReset,
                  minutes: minutesUntilReset,
                })}
              </span>
            </div>
          </>
        ) : (
          <>
            <Clock size={14} className={styles.hintIcon} />
            <span>{t('quota.reset_hint')}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(VoteQuotaBar);
