/**
 * PeriodFilter 컴포넌트
 *
 * 통계 페이지의 기간 필터 버튼 그룹입니다.
 * 오늘 / 7일 / 30일 / 전체 중 하나를 선택할 수 있습니다.
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import type { PeriodType } from '@/data/mock-analytics';
import styles from './PeriodFilter.module.scss';

interface PeriodFilterProps {
  /** 현재 선택된 기간 */
  selected: PeriodType;
  /** 기간 변경 핸들러 */
  onChange: (period: PeriodType) => void;
}

/** 기간 옵션 목록 */
const PERIODS: PeriodType[] = ['today', 'week', 'month', 'all'];

export default function PeriodFilter({ selected, onChange }: PeriodFilterProps) {
  const t = useTranslations('Analytics');

  return (
    <div className={styles.container}>
      {PERIODS.map((period) => (
        <button
          key={period}
          className={classNames(styles.button, {
            [styles.active]: selected === period,
          })}
          onClick={() => onChange(period)}
          aria-pressed={selected === period}
        >
          {/* 활성화 상태 배경 애니메이션 */}
          {selected === period && (
            <motion.div
              className={styles.activeBackground}
              layoutId="period-indicator"
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
            />
          )}
          <span className={styles.label}>{t(`period.${period}`)}</span>
        </button>
      ))}
    </div>
  );
}
