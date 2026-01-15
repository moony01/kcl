/**
 * GrandChampionCard 컴포넌트
 *
 * 연간 대상 수상자를 표시하는 히어로 카드입니다.
 * Black & Gold 테마로 최고 권위를 표현합니다.
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import type { GrandChampion } from '@/types/hall-of-fame';
import styles from './GrandChampionCard.module.scss';

interface GrandChampionCardProps {
  /** 대상 수상자 데이터 */
  champion: GrandChampion;
}

export default function GrandChampionCard({ champion }: GrandChampionCardProps) {
  const t = useTranslations('HallOfFame');

  // 득표수 포맷팅
  const formatVotes = (votes: number): string => {
    if (votes >= 1000000) {
      return `${(votes / 1000000).toFixed(1)}M`;
    }
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(0)}K`;
    }
    return votes.toLocaleString();
  };

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 배경 장식 */}
      <div className={styles.backgroundDecor}>
        <div className={styles.glowEffect} />
        <div className={styles.particles} />
      </div>

      {/* 타이틀 배지 */}
      <motion.div
        className={styles.titleBadge}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Trophy className={styles.trophyIcon} size={20} />
        <span>
          {t('grand_champion')} {champion.year}
        </span>
      </motion.div>

      {/* 소속사 로고 */}
      <motion.div
        className={styles.logoSection}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
      >
        <div className={styles.logoWrapper} style={{ background: champion.companyLogo }}>
          <span className={styles.logoText}>{champion.companyName.charAt(0)}</span>
        </div>
        <div className={styles.shineEffect} />
      </motion.div>

      {/* 소속사 이름 */}
      <motion.h2
        className={styles.companyName}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        {champion.companyName}
      </motion.h2>

      {/* 연간 챔피언 타이틀 */}
      <motion.p
        className={styles.subtitle}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {t('annual_champion')}
      </motion.p>

      {/* 통계 */}
      <motion.div
        className={styles.stats}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <div className={styles.statItem}>
          <span className={styles.statValue}>{champion.winCount}</span>
          <span className={styles.statLabel}>{t('victories')}</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statValue}>{formatVotes(champion.totalVotesInYear)}</span>
          <span className={styles.statLabel}>Total Votes</span>
        </div>
      </motion.div>
    </motion.article>
  );
}
