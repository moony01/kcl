/**
 * SeasonHeader
 *
 * 시즌 대시보드 컴포넌트 (T1.16 승강전 통합)
 * - 현재 시즌 (2026년 1월 시즌)
 * - D-day 카운트다운
 * - 현재 1위 소속사 표시
 * - ⭐ 승강전 정보 (10위 vs 11위 + GAP)
 * - 실시간 업데이트 인디케이터 + 20초 카운트다운 (T1.31)
 *
 * @updated T1.16 - 승강전 정보를 SeasonHeader에 통합
 * @updated T1.31 - 실시간 업데이트 카운트다운 UI 추가
 * @updated T1.34 - Header 드롭다운 겹침 해결 (SCSS에서 상단 여백 조정)
 * @updated T1.35 - 1위/승강전 세로 중앙 정렬 + 사이즈 확대
 * @updated T1.49 - 승강전 로고 추가 + 반응형 레이아웃 개선 (PC: 1줄, 모바일: 2줄)
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  RefreshCw,
  Flame,
  Swords,
  TrendingDown,
  TrendingUp,
  Loader2,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import type { SeasonInfo, CompanyRanking, PromotionBattle } from '@/types/league';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import styles from './SeasonHeader.module.scss';
import classNames from 'classnames';

interface SeasonHeaderProps {
  /** 시즌 정보 */
  season: SeasonInfo;
  /** 현재 1위 소속사 */
  leader: CompanyRanking | null;
  /** 승강전 정보 (10위 vs 11위) */
  promotionBattle?: PromotionBattle | null;
  /** 투표 핸들러 */
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

  // 슬라이드 상태 (0: 1위, 1: 승강전)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // 승강전 정보가 있을 때만 슬라이드 가능
  const hasPromotionBattle = !!promotionBattle;
  const totalSlides = hasPromotionBattle ? 2 : 1;

  // T1.31: 데이터 갱신 카운트다운
  const { countdown, isRefreshing } = useRefreshCountdown({
    intervalMs: 20000,
    refreshingDurationMs: 1500,
  });

  const formatDaysRemaining = () => {
    if (season.daysRemaining === 0) return t('ends_today');
    return t('days_remaining', { days: season.daysRemaining });
  };

  const handleLeaderClick = () => {
    if (leader && onVote) onVote(leader.companyId);
  };

  const handleBattleClick = (companyId: string) => {
    if (onVote) onVote(companyId);
  };

  // 슬라이드 이동
  const paginate = (newDirection: number) => {
    if (!hasPromotionBattle) return;
    setDirection(newDirection);
    setCurrentIndex((prev) => {
      let next = prev + newDirection;
      if (next < 0) next = totalSlides - 1;
      if (next >= totalSlides) next = 0;
      return next;
    });
  };

  // 슬라이드 애니메이션 설정
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
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

      {/* 실시간 업데이트 인디케이터 (우상단 절대 위치) */}
      <div className={styles.realtimeIndicator}>
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="refreshing"
              className={styles.refreshingState}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              >
                <Loader2 size={14} />
              </motion.span>
              <span className={styles.refreshingText}>{t('refreshing')}</span>
            </motion.div>
          ) : (
            <motion.div
              key="countdown"
              className={styles.countdownState}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              >
                <RefreshCw size={14} />
              </motion.span>
              <span>{t('realtime')}</span>
              <span className={styles.countdownBadge}>
                {t('countdown', { seconds: countdown })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 메인 슬라이드 영역 */}
      <div className={styles.sliderContainer}>
        {/* 왼쪽 화살표 */}
        {hasPromotionBattle && (
          <button
            className={classNames(styles.arrowBtn, styles.prev)}
            onClick={() => paginate(-1)}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className={styles.slideTrack}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {currentIndex === 0 && leader && (
              <motion.div
                key="leader"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className={styles.slideItem}
              >
                {/* 1위 카드 디자인 */}
                <div className={styles.leaderCard} onClick={handleLeaderClick} role="button">
                  <div className={styles.leaderBg} />
                  <div className={styles.leaderContent}>
                    <div className={styles.crownBadge}>
                      <Trophy size={14} fill="#FFD700" color="#B8860B" />
                      <span>CURRENT #1</span>
                    </div>

                    <div className={styles.leaderMain}>
                      <div
                        className={styles.leaderLogo}
                        style={{ background: leader.gradientColor }}
                      >
                        {leader.nameEn.charAt(0)}
                      </div>
                      <div className={styles.leaderText}>
                        <h2 className={styles.leaderName}>{leader.nameEn}</h2>
                        <div className={styles.leaderScore}>
                          <Flame size={16} className={styles.flameIcon} />
                          <span>{leader.voteCount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentIndex === 1 && promotionBattle && (
              <motion.div
                key="battle"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                className={styles.slideItem}
              >
                {/* 승강전 카드 디자인 */}
                <div className={styles.battleCard}>
                  <div className={styles.battleHeader}>
                    <Swords size={14} className={styles.swordsIcon} />
                    <span className={styles.battleTitle}>{tBattle('title')}</span>
                  </div>

                  <div className={styles.battleContent}>
                    {/* 10위 */}
                    <div
                      className={styles.battleCompany}
                      data-zone="relegation"
                      onClick={() => handleBattleClick(promotionBattle.relegationCompany.companyId)}
                    >
                      <div className={styles.battleLogo}>
                        {promotionBattle.relegationCompany.logoUrl ? (
                          <Image
                            src={promotionBattle.relegationCompany.logoUrl}
                            alt={promotionBattle.relegationCompany.nameEn}
                            width={32}
                            height={32}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattle.relegationCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.battleInfo}>
                        <span className={styles.battleRank}>#10</span>
                        <span className={styles.battleName}>
                          {promotionBattle.relegationCompany.nameEn}
                        </span>
                      </div>
                    </div>

                    {/* GAP */}
                    <div className={styles.vsSection}>
                      <span className={styles.vsText}>VS</span>
                      <div className={styles.gapBadge}>
                        <span className={styles.gapLabel}>GAP</span>
                        <span className={styles.gapValue}>
                          {promotionBattle.gap.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* 11위 */}
                    <div
                      className={styles.battleCompany}
                      data-zone="promotion"
                      onClick={() => handleBattleClick(promotionBattle.promotionCompany.companyId)}
                    >
                      <div className={styles.battleLogo}>
                        {promotionBattle.promotionCompany.logoUrl ? (
                          <Image
                            src={promotionBattle.promotionCompany.logoUrl}
                            alt={promotionBattle.promotionCompany.nameEn}
                            width={32}
                            height={32}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattle.promotionCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.battleInfo}>
                        <span className={styles.battleRank}>#11</span>
                        <span className={styles.battleName}>
                          {promotionBattle.promotionCompany.nameEn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 오른쪽 화살표 */}
        {hasPromotionBattle && (
          <button
            className={classNames(styles.arrowBtn, styles.next)}
            onClick={() => paginate(1)}
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* 인디케이터 */}
      {hasPromotionBattle && (
        <div className={styles.indicators}>
          {[0, 1].map((idx) => (
            <button
              key={idx}
              className={classNames(styles.dot, { [styles.active]: idx === currentIndex })}
              onClick={() => {
                const newDir = idx > currentIndex ? 1 : -1;
                setDirection(newDir);
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </header>
  );
}
