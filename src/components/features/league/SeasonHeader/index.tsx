/**
 * SeasonHeader
 *
 * 시즌 대시보드 컴포넌트 (T1.16 승강전 통합)
 * - 현재 시즌 (2026년 1월 시즌)
 * - D-day 카운트다운
 * - 현재 1위 소속사 표시
 * - ⭐ 승강전 정보 (10위 vs 11위 + GAP)
 * - 실시간 업데이트 인디케이터
 *
 * @updated T1.16 - 승강전 정보를 SeasonHeader에 통합
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Flame, Swords, TrendingDown, TrendingUp } from 'lucide-react';
import type { SeasonInfo, CompanyRanking, PromotionBattle } from '@/types/league';
import styles from './SeasonHeader.module.scss';

interface SeasonHeaderProps {
  /** 시즌 정보 */
  season: SeasonInfo;
  /** 현재 1위 소속사 */
  leader: CompanyRanking | null;
  /** 승강전 정보 (10위 vs 11위) - T1.16 추가 */
  promotionBattle?: PromotionBattle | null;
  /** 투표 핸들러 (1위/10위/11위 클릭 시) - T1.16 추가 */
  onVote?: (companyId: string) => void;
}

export default function SeasonHeader({
  season,
  leader,
  promotionBattle,
  onVote,
}: SeasonHeaderProps) {
  const t = useTranslations('League.season');
  const tBattle = useTranslations('League.promotion_battle');

  /** D-day 표시 포맷 */
  const formatDaysRemaining = () => {
    if (season.daysRemaining === 0) {
      return t('ends_today');
    }
    return t('days_remaining', { days: season.daysRemaining });
  };

  /** 1위 클릭 핸들러 */
  const handleLeaderClick = () => {
    if (leader && onVote) {
      onVote(leader.companyId);
    }
  };

  /** 10위/11위 클릭 핸들러 */
  const handleBattleClick = (companyId: string) => {
    if (onVote) {
      onVote(companyId);
    }
  };

  return (
    <header className={styles.seasonHeader}>
      {/* 상단 행: 시즌 정보 + D-day */}
      <div className={styles.topRow}>
        <div className={styles.seasonTitle}>
          <Trophy className={styles.trophyIcon} size={20} />
          <h1 className={styles.title}>
            <span className={styles.brand}>KPOP COMPANY LEAGUE</span>
            <span className={styles.seasonInfo}>
              {t('title', { year: season.year, month: season.month })}
            </span>
          </h1>
        </div>

        <motion.div
          className={styles.daysRemaining}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className={season.daysRemaining <= 3 ? styles.urgent : ''}>
            {formatDaysRemaining()}
          </span>
        </motion.div>
      </div>

      {/* 구분선 */}
      <div className={styles.divider} />

      {/* 하단 행: 1위 정보 + 승강전 */}
      <div className={styles.bottomRow}>
        {/* 현재 1위 표시 (클릭 가능) */}
        {leader && (
          <motion.div
            className={styles.leaderInfo}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleLeaderClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLeaderClick()}
          >
            <span className={styles.leaderLabel}>{t('current_leader')}</span>
            <div className={styles.leaderCompany}>
              <div className={styles.companyLogo} style={{ background: leader.gradientColor }}>
                {leader.nameEn.charAt(0)}
              </div>
              <div className={styles.companyDetails}>
                <span className={styles.companyName}>{leader.nameEn}</span>
                <span className={styles.voteCount}>
                  <Flame size={12} />
                  {leader.voteCount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 승강전 정보 (10위 vs 11위) - T1.16 추가 */}
        {promotionBattle && (
          <motion.div
            className={styles.promotionBattleSection}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className={styles.battleHeader}>
              <Swords size={14} className={styles.swordsIcon} />
              <span className={styles.battleTitle}>{tBattle('title')}</span>
            </div>

            <div className={styles.battleContent}>
              {/* 10위 (강등 위기) */}
              <div
                className={styles.battleCompany}
                data-zone="relegation"
                onClick={() => handleBattleClick(promotionBattle.relegationCompany.companyId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' &&
                  handleBattleClick(promotionBattle.relegationCompany.companyId)
                }
              >
                <TrendingDown size={10} className={styles.zoneIcon} />
                <span className={styles.battleRank}>10위</span>
                <span className={styles.battleName}>
                  {promotionBattle.relegationCompany.nameEn}
                </span>
                <span className={styles.battleVotes}>
                  {promotionBattle.relegationCompany.voteCount.toLocaleString()}
                </span>
              </div>

              {/* GAP 표시 */}
              <div className={styles.gapBadge}>
                <span className={styles.gapArrow}>←</span>
                <span className={styles.gapValue}>{promotionBattle.gap.toLocaleString()}</span>
                <span className={styles.gapArrow}>→</span>
              </div>

              {/* 11위 (승격 기회) */}
              <div
                className={styles.battleCompany}
                data-zone="promotion"
                onClick={() => handleBattleClick(promotionBattle.promotionCompany.companyId)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleBattleClick(promotionBattle.promotionCompany.companyId)
                }
              >
                <TrendingUp size={10} className={styles.zoneIcon} />
                <span className={styles.battleRank}>11위</span>
                <span className={styles.battleName}>{promotionBattle.promotionCompany.nameEn}</span>
                <span className={styles.battleVotes}>
                  {promotionBattle.promotionCompany.voteCount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 실시간 업데이트 인디케이터 */}
      <div className={styles.realtimeIndicator}>
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          <RefreshCw size={14} />
        </motion.span>
        <span>{t('realtime')}</span>
      </div>
    </header>
  );
}
