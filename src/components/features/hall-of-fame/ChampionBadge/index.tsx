/**
 * ChampionBadge 컴포넌트
 *
 * 월간 챔피언을 표시하는 배지 컴포넌트입니다.
 * 소속사 로고, 이름, 월 정보를 표시합니다.
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { MonthlyChampion } from '@/types/hall-of-fame';
import styles from './ChampionBadge.module.scss';

interface ChampionBadgeProps {
  /** 월간 챔피언 데이터 */
  champion: MonthlyChampion;
  /** 배지 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 클릭 핸들러 */
  onClick?: () => void;
}

export default function ChampionBadge({ champion, size = 'medium', onClick }: ChampionBadgeProps) {
  const t = useTranslations('HallOfFame');

  // 월 이름 가져오기
  const monthKey = champion.month.toString() as
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12';

  return (
    <motion.div
      className={`${styles.badge} ${styles[size]}`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* 소속사 로고 */}
      <div className={styles.logoWrapper} style={{ background: champion.companyLogo }}>
        <span className={styles.logoText}>{champion.companyName.charAt(0)}</span>
      </div>

      {/* 월 정보 */}
      <div className={styles.monthLabel}>{t(`months.${monthKey}`)}</div>

      {/* 소속사 이름 (large 사이즈만) */}
      {size === 'large' && <div className={styles.companyName}>{champion.companyName}</div>}
    </motion.div>
  );
}
