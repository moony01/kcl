/**
 * TopThreeCard
 *
 * 상위 3위 대형 카드 컴포넌트
 * - 금(1위), 은(2위), 동(3위) 메달 아이콘
 * - 화려한 그라데이션 배경
 * - 호버 시 스케일 효과
 */

'use client';

import { motion } from 'framer-motion';
import { Medal, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import classNames from 'classnames';
import type { CompanyRanking } from '@/types/league';
import styles from './TopThreeCard.module.scss';

interface TopThreeCardProps {
  /** 소속사 정보 */
  company: CompanyRanking;
  /** 순위 (1, 2, 3) */
  rank: 1 | 2 | 3;
  /** 투표 핸들러 (Deprecated) */
  onVote?: () => void;
  /** 배틀스테이션에 선택된 상태인지 */
  isSelected?: boolean;
}

/** 순위별 메달 색상 */
const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: '#FFD700', // 금
  2: '#C0C0C0', // 은
  3: '#CD7F32', // 동
};

/** 순위별 메달 이모지 */
const MEDAL_EMOJI: Record<1 | 2 | 3, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function TopThreeCard({
  company,
  rank,
  onVote: _onVote,
  isSelected = false,
}: TopThreeCardProps) {
  const medalColor = MEDAL_COLORS[rank];

  /** 순위 변동 아이콘 */
  const renderRankChange = () => {
    if (company.rankChange > 0) {
      return (
        <span className={styles.rankUp}>
          <TrendingUp size={12} />
          {company.rankChange}
        </span>
      );
    }
    if (company.rankChange < 0) {
      return (
        <span className={styles.rankDown}>
          <TrendingDown size={12} />
          {Math.abs(company.rankChange)}
        </span>
      );
    }
    return (
      <span className={styles.rankSame}>
        <Minus size={12} />
      </span>
    );
  };

  return (
    <motion.article
      className={classNames(styles.card, {
        [styles.selected]: isSelected,
        [styles.rankUpGlow]: company.rankChange > 0,
        [styles.rankDownGlow]: company.rankChange < 0,
      })}
      data-rank={rank}
      layout
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: (rank - 1) * 0.1,
        layout: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        },
      }}
      onClick={_onVote}
    >
      {/* 메달 뱃지 */}
      <div className={styles.medalBadge} style={{ background: medalColor }}>
        <span className={styles.medalEmoji}>{MEDAL_EMOJI[rank]}</span>
        <Medal size={16} color="white" />
      </div>

      {/* 회사 로고 */}
      <div className={styles.logoWrapper}>
        <div className={styles.logo} style={{ background: company.gradientColor }}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.nameEn} className={styles.logoImage} />
          ) : (
            company.nameEn.charAt(0)
          )}
        </div>
        {/* 글로우 효과 */}
        <div className={styles.glow} style={{ background: company.gradientColor }} />
      </div>

      {/* 회사 정보 */}
      <div className={styles.info}>
        <h3 className={styles.companyName}>{company.nameEn}</h3>

        {/* 투표 수 */}
        <div className={styles.voteCount}>
          <Flame size={14} className={styles.fireIcon} />
          <span>{company.voteCount.toLocaleString()}</span>
          {renderRankChange()}
        </div>

        {/* 시간당 투표 */}
        {company.voteCountHourly > 0 && (
          <p className={styles.hourlyVotes}>+{company.voteCountHourly.toLocaleString()}/h</p>
        )}
      </div>

    </motion.article>
  );
}
