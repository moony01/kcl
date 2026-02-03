/**
 * SeasonHeader
 *
 * ✨ 프리미엄 시즌 대시보드 컴포넌트 (Luna 디자인 업그레이드)
 * - 현재 시즌 정보 + D-day 카운트다운
 * - 현재 1위 소속사 (골드 프리미엄 효과)
 * - 승강전 정보 (드라마틱 VS 대결 구도)
 * - 실시간 업데이트 인디케이터 + 20초 카운트다운
 *
 * @updated T1.16 - 승강전 정보를 SeasonHeader에 통합
 * @updated T1.31 - 실시간 업데이트 카운트다운 UI 추가
 * @updated T1.34 - Header 드롭다운 겹침 해결
 * @updated T1.35 - 1위/승강전 세로 중앙 정렬 + 사이즈 확대
 * @updated T1.49 - 승강전 로고 추가 + 반응형 레이아웃 개선
 * @updated Luna - 프리미엄 UI/UX 디자인 업그레이드 (글로우, shimmer, 드라마틱 애니메이션)
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  RefreshCw,
  Flame,
  Swords,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Pause,
  Play,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import type { SeasonInfo, CompanyRanking, PromotionBattle, PromotionBattles } from '@/types/league';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import styles from './SeasonHeader.module.scss';
import classNames from 'classnames';

/**
 * 시즌 결산까지 남은 시간 계산
 *
 * 결산 기준: 매월 1일 KST 09:00 (= UTC 00:00)
 * - GitHub Actions cron: `0 0 1 * *` (UTC 00:00)
 * - 한국 시간으로 매월 1일 오전 9시에 결산
 *
 * @returns 남은 밀리초
 */
function getTimeUntilSeasonEnd(): number {
  const now = new Date();

  // 현재 시간을 KST로 계산 (UTC + 9시간)
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset + now.getTimezoneOffset() * 60 * 1000);

  // 이번 달 1일 KST 09:00 (결산 시간)
  const thisMonthSettlement = new Date(
    kstNow.getFullYear(),
    kstNow.getMonth(),
    1,
    9, 0, 0, 0
  );

  // 다음 달 1일 KST 09:00 (다음 결산 시간)
  const nextMonthSettlement = new Date(
    kstNow.getFullYear(),
    kstNow.getMonth() + 1,
    1,
    9, 0, 0, 0
  );

  // KST 기준 현재 시간이 이번 달 결산 시간 이전이면 → 이번 달 결산까지
  // 이미 지났으면 → 다음 달 결산까지
  const targetSettlement = kstNow < thisMonthSettlement ? thisMonthSettlement : nextMonthSettlement;

  // KST 목표 시간을 로컬 시간으로 변환하여 차이 계산
  const targetLocal = new Date(
    targetSettlement.getTime() - kstOffset - now.getTimezoneOffset() * 60 * 1000
  );

  return targetLocal.getTime() - now.getTime();
}

/**
 * 남은 시간을 일/시/분/초로 분해
 */
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function parseTimeRemaining(ms: number): TimeRemaining {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalMs: ms };
}

interface SeasonHeaderProps {
  /** 시즌 정보 */
  season: SeasonInfo;
  /** 현재 1위 소속사 */
  leader: CompanyRanking | null;
  /** 승강전 정보 (10위 vs 11위) - 기존 호환성 유지 */
  promotionBattle?: PromotionBattle | null;
  /** 전체 승강전 정보 (직행 + 플레이오프) - 2026년 개편 */
  promotionBattles?: PromotionBattles | null;
  /** 투표 핸들러 */
  onVote?: (companyId: string) => void;
}

export default function SeasonHeader({
  season,
  leader,
  promotionBattle,
  promotionBattles,
  onVote,
}: SeasonHeaderProps) {
  const t = useTranslations('League.season');
  const tBattle = useTranslations('League.promotion_battle');
  const locale = useLocale();

  /**
   * 월 번호를 해당 로케일에 맞는 월 이름으로 변환
   * - 한국어: 1, 2, 3... (숫자 그대로)
   * - 영어/기타: January, February, March... (월 이름)
   */
  const formatMonth = useCallback(
    (month: number): string => {
      // 한국어, 일본어, 중국어는 숫자+월 형식 사용
      const numericLocales = ['ko', 'ja', 'zh'];
      if (numericLocales.includes(locale)) {
        return String(month);
      }
      // 그 외 언어는 월 이름 사용
      const date = new Date(2026, month - 1, 1);
      return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
    },
    [locale]
  );

  // 슬라이드 상태 (0: 1위, 1: 승강전)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  // 자동 슬라이드 일시정지 상태
  const [isPaused, setIsPaused] = useState(false);

  // 시즌 결산까지 남은 시간 (실시간 카운트다운)
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    parseTimeRemaining(getTimeUntilSeasonEnd())
  );

  // 1초마다 남은 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(parseTimeRemaining(getTimeUntilSeasonEnd()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2026년 개편: 슬라이드 3개 (1위 / 직행 승강전 / 플레이오프)
  const hasPromotionBattle = !!promotionBattle;
  const hasPlayoffBattle = !!promotionBattles?.playoff;
  // 슬라이드 수: 1(1위) + 1(직행, 있으면) + 1(플레이오프, 있으면)
  const totalSlides = 1 + (hasPromotionBattle ? 1 : 0) + (hasPlayoffBattle ? 1 : 0);
  const hasMultipleSlides = totalSlides > 1;

  // T1.31: 데이터 갱신 카운트다운
  const { countdown, isRefreshing } = useRefreshCountdown({
    intervalMs: 20000,
    refreshingDurationMs: 1500,
  });

  // 마지막 날 여부 (D-0: 24시간 미만)
  const isLastDay = timeRemaining.days === 0;
  // 임박 여부 (D-1만 해당, D-0은 lastDay로 처리)
  const isUrgent = timeRemaining.days === 1;

  /**
   * 남은 시간 포맷팅
   * - D-2 이상: "D-27일 남음"
   * - D-1: "D-1 임박!" (urgent 스타일)
   * - D-0: "23:59:59" 실시간 카운트다운
   */
  const formatDaysRemaining = useCallback(() => {
    const { days, hours, minutes, seconds } = timeRemaining;

    // 마지막 날: 시:분:초 카운트다운
    if (days === 0) {
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }

    // D-1: 임박 표시
    if (days === 1) {
      return t('days_remaining_urgent', { days: 1 });
    }

    // D-2 이상: 일반 표시
    return t('days_remaining', { days });
  }, [timeRemaining, t]);

  const handleLeaderClick = () => {
    if (leader && onVote) onVote(leader.companyId);
  };

  const handleBattleClick = (companyId: string) => {
    if (onVote) onVote(companyId);
  };

  // 슬라이드 이동 (useCallback으로 메모이제이션하여 useEffect 의존성 안정화)
  const paginate = useCallback(
    (newDirection: number) => {
      if (!hasMultipleSlides) return;
      setDirection(newDirection);
      setCurrentIndex((prev) => {
        let next = prev + newDirection;
        if (next < 0) next = totalSlides - 1;
        if (next >= totalSlides) next = 0;
        return next;
      });
    },
    [hasMultipleSlides, totalSlides]
  );

  // 5초마다 자동 슬라이드 (슬라이드가 2개 이상이고, 일시정지 상태가 아닐 때만 동작)
  useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;

    const autoSlideInterval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(autoSlideInterval);
  }, [hasMultipleSlides, isPaused, paginate]);

  // 자동 슬라이드 멈춤/재생 토글
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // 슬라이드 애니메이션 설정 (더 부드럽게)
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 350 : -350,
      opacity: 0,
      scale: 0.85,
      rotateY: direction > 0 ? 15 : -15,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 350 : -350,
      opacity: 0,
      scale: 0.85,
      rotateY: direction < 0 ? 15 : -15,
    }),
  };

  // 카드 호버 애니메이션 설정
  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -4 },
    tap: { scale: 0.98 },
  };

  // 배틀 카드 호버 애니메이션 설정
  const battleCompanyVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.04, y: -5 },
    tap: { scale: 0.97 },
  };

  return (
    <motion.header
      className={styles.seasonHeader}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* 상단 행: 시즌 정보 + 우측 정보 (실시간 업데이트 + D-day) */}
      <div className={styles.topRow}>
        <motion.div
          className={styles.seasonTitle}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, -5, 5, 0],
              scale: [1, 1.1, 1.1, 1.05, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 5,
            }}
          >
            <Trophy className={styles.trophyIcon} size={22} />
          </motion.div>
          <h1 className={styles.title}>
            <span className={styles.brand}>KPOP COMPANY LEAGUE</span>
            <span className={styles.seasonInfo}>
              {t('title', { year: season.year, month: formatMonth(season.month) })}
            </span>
          </h1>
        </motion.div>

        {/* 우측 정보 그룹: 실시간 업데이트 + D-day */}
        <motion.div
          className={styles.rightInfo}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          {/* 실시간 업데이트 인디케이터 */}
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
                    transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                  >
                    <Loader2 size={12} />
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
                    transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                  >
                    <RefreshCw size={12} />
                  </motion.span>
                  <span>{t('realtime')}</span>
                  <motion.span
                    className={styles.countdownBadge}
                    key={countdown}
                    initial={{ scale: 1.1, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t('countdown', { seconds: countdown })}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* D-day 배지 */}
          <motion.div
            className={classNames(styles.daysRemaining, {
              [styles.lastDay]: isLastDay,
              [styles.urgent]: isUrgent,
            })}
            whileHover={{ scale: 1.03 }}
          >
            {/* 마지막 날: 시계 아이콘 + 카운트다운 */}
            {isLastDay && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Clock size={14} className={styles.clockIcon} />
              </motion.span>
            )}
            <span>{formatDaysRemaining()}</span>
          </motion.div>
        </motion.div>
      </div>

      {/* 메인 슬라이드 영역 (스와이프 지원) */}
      <motion.div
        className={styles.sliderContainer}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {/* 왼쪽 화살표 */}
        {hasMultipleSlides && (
          <motion.button
            className={classNames(styles.arrowBtn, styles.prev)}
            onClick={() => paginate(-1)}
            aria-label="Previous slide"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft size={24} />
          </motion.button>
        )}

        <motion.div
          className={styles.slideTrack}
          drag={hasMultipleSlides ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (!hasMultipleSlides) return;
            // 스와이프 임계값: 40px 이상 또는 빠른 스와이프
            const swipeThreshold = 40;
            const velocityThreshold = 400;

            if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
              paginate(1); // 다음 슬라이드
            } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
              paginate(-1); // 이전 슬라이드
            }
          }}
          style={{ cursor: hasMultipleSlides ? 'grab' : 'default', touchAction: 'pan-y' }}
          whileDrag={{ cursor: 'grabbing' }}
        >
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
                  x: { type: 'spring', stiffness: 250, damping: 28 },
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.3 },
                  rotateY: { duration: 0.4 },
                }}
                className={styles.slideItem}
              >
                {/* 1위 카드 디자인 (프리미엄) */}
                <motion.div
                  className={styles.leaderCard}
                  onClick={handleLeaderClick}
                  role="button"
                  tabIndex={0}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className={styles.leaderBg} />
                  <div className={styles.leaderContent}>
                    <motion.div
                      className={styles.crownBadge}
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <Crown size={14} fill="#FFD700" color="#B8860B" />
                      <span>CURRENT #1</span>
                    </motion.div>

                    <div className={styles.leaderMain}>
                      <motion.div
                        className={styles.leaderLogo}
                        style={{ background: leader.gradientColor }}
                        whileHover={{ scale: 1.08, rotate: 3 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        {leader.nameEn.charAt(0)}
                      </motion.div>
                      <div className={styles.leaderText}>
                        <h2 className={styles.leaderName}>{leader.nameEn}</h2>
                        <motion.div
                          className={styles.leaderScore}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <Flame size={18} className={styles.flameIcon} />
                          </motion.span>
                          <span>{leader.voteCount.toLocaleString()}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* 슬라이드 2: 직행 승강 (10위 강등, 1위 승격 - 점수 비교 없음) */}
            {currentIndex === 1 && promotionBattle && (
              <motion.div
                key="direct-battle"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 250, damping: 28 },
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.3 },
                  rotateY: { duration: 0.4 },
                }}
                className={styles.slideItem}
              >
                {/* 직행 승강 카드 (VS 없음 - 무조건 교체) */}
                <div className={styles.battleCard} data-type="direct">
                  <motion.div
                    className={styles.battleHeader}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Swords size={16} className={styles.swordsIcon} />
                    </motion.span>
                    <span className={styles.battleTitle}>{tBattle('direct_title')}</span>
                  </motion.div>

                  <div className={styles.directContent}>
                    {/* 1부 10위 → 2부 강등 */}
                    <motion.div
                      className={styles.directCompany}
                      data-zone="relegation"
                      onClick={() => handleBattleClick(promotionBattle.relegationCompany.companyId)}
                      variants={battleCompanyVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className={styles.directLogo}>
                        {promotionBattle.relegationCompany.logoUrl ? (
                          <Image
                            src={promotionBattle.relegationCompany.logoUrl}
                            alt={promotionBattle.relegationCompany.nameEn}
                            width={40}
                            height={40}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattle.relegationCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.directInfo}>
                        <span className={styles.directRank}>#10</span>
                        <span className={styles.directName}>
                          {promotionBattle.relegationCompany.nameEn}
                        </span>
                      </div>
                      <motion.div
                        className={styles.directArrow}
                        data-direction="down"
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ChevronRight size={20} style={{ transform: 'rotate(90deg)' }} />
                        <span>{tBattle('relegation_direct')}</span>
                      </motion.div>
                    </motion.div>

                    {/* 구분선 */}
                    <div className={styles.directDivider}>
                      <span className={styles.swapIcon}>⇅</span>
                    </div>

                    {/* 2부 1위 → 1부 승격 */}
                    <motion.div
                      className={styles.directCompany}
                      data-zone="promotion"
                      onClick={() => handleBattleClick(promotionBattle.promotionCompany.companyId)}
                      variants={battleCompanyVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className={styles.directLogo}>
                        {promotionBattle.promotionCompany.logoUrl ? (
                          <Image
                            src={promotionBattle.promotionCompany.logoUrl}
                            alt={promotionBattle.promotionCompany.nameEn}
                            width={40}
                            height={40}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattle.promotionCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.directInfo}>
                        <span className={styles.directRank}>#1</span>
                        <span className={styles.directName}>
                          {promotionBattle.promotionCompany.nameEn}
                        </span>
                      </div>
                      <motion.div
                        className={styles.directArrow}
                        data-direction="up"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <ChevronRight size={20} style={{ transform: 'rotate(-90deg)' }} />
                        <span>{tBattle('promotion_direct')}</span>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 슬라이드 3: 플레이오프 (9위 vs 2위) */}
            {currentIndex === 2 && promotionBattles?.playoff && (
              <motion.div
                key="playoff-battle"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 250, damping: 28 },
                  opacity: { duration: 0.25 },
                  scale: { duration: 0.3 },
                  rotateY: { duration: 0.4 },
                }}
                className={styles.slideItem}
              >
                {/* 플레이오프 카드 (9위 vs 2위) */}
                <div className={styles.battleCard}>
                  <motion.div
                    className={styles.battleHeader}
                    data-type="playoff"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <motion.span
                      animate={{ rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      <Swords size={16} className={styles.swordsIcon} />
                    </motion.span>
                    <span className={styles.battleTitle}>{tBattle('playoff_title')}</span>
                  </motion.div>

                  <div className={styles.battleContent}>
                    {/* 1부 9위 (강등 위기) */}
                    <motion.div
                      className={styles.battleCompany}
                      data-zone="relegation-danger"
                      onClick={() => handleBattleClick(promotionBattles.playoff.dangerCompany.companyId)}
                      variants={battleCompanyVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className={styles.battleLogo}>
                        {promotionBattles.playoff.dangerCompany.logoUrl ? (
                          <Image
                            src={promotionBattles.playoff.dangerCompany.logoUrl}
                            alt={promotionBattles.playoff.dangerCompany.nameEn}
                            width={44}
                            height={44}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattles.playoff.dangerCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.battleInfo}>
                        <span className={styles.battleRank}>#9</span>
                        <span className={styles.battleName}>
                          {promotionBattles.playoff.dangerCompany.nameEn}
                        </span>
                        <span className={styles.statusLabel} data-status="relegation-danger">
                          {tBattle('relegation_danger')}
                        </span>
                      </div>
                    </motion.div>

                    {/* VS + GAP */}
                    <motion.div
                      className={styles.vsSection}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <motion.span
                        className={styles.vsText}
                        animate={{
                          textShadow: [
                            '0 0 20px rgba(212, 175, 55, 0.6)',
                            '0 0 40px rgba(212, 175, 55, 0.9)',
                            '0 0 20px rgba(212, 175, 55, 0.6)',
                          ],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        VS
                      </motion.span>
                      <motion.div
                        className={classNames(styles.gapBadge, {
                          [styles.chanceWinning]: promotionBattles.playoff.isChanceWinning,
                        })}
                        whileHover={{ scale: 1.08 }}
                      >
                        <span className={styles.gapLabel}>GAP</span>
                        <motion.span
                          className={styles.gapValue}
                          key={promotionBattles.playoff.gap}
                          initial={{ scale: 1.3, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring' }}
                        >
                          {Math.abs(promotionBattles.playoff.gap).toLocaleString()}
                        </motion.span>
                      </motion.div>
                    </motion.div>

                    {/* 2부 2위 (승격 기회) */}
                    <motion.div
                      className={styles.battleCompany}
                      data-zone="promotion-chance"
                      onClick={() => handleBattleClick(promotionBattles.playoff.chanceCompany.companyId)}
                      variants={battleCompanyVariants}
                      initial="rest"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className={styles.battleLogo}>
                        {promotionBattles.playoff.chanceCompany.logoUrl ? (
                          <Image
                            src={promotionBattles.playoff.chanceCompany.logoUrl}
                            alt={promotionBattles.playoff.chanceCompany.nameEn}
                            width={44}
                            height={44}
                            className={styles.logoImage}
                          />
                        ) : (
                          <span className={styles.logoFallback}>
                            {promotionBattles.playoff.chanceCompany.nameEn.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className={styles.battleInfo}>
                        <span className={styles.battleRank}>#2</span>
                        <span className={styles.battleName}>
                          {promotionBattles.playoff.chanceCompany.nameEn}
                        </span>
                        <span className={styles.statusLabel} data-status="promotion-chance">
                          {tBattle('promotion_chance')}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 오른쪽 화살표 */}
        {hasMultipleSlides && (
          <motion.button
            className={classNames(styles.arrowBtn, styles.next)}
            onClick={() => paginate(1)}
            aria-label="Next slide"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight size={24} />
          </motion.button>
        )}
      </motion.div>

      {/* 인디케이터 + 멈춤/재생 버튼 */}
      {hasMultipleSlides && (
        <motion.div
          className={styles.indicators}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {Array.from({ length: totalSlides }, (_, idx) => (
            <motion.button
              key={idx}
              className={classNames(styles.dot, { [styles.active]: idx === currentIndex })}
              onClick={() => {
                const newDir = idx > currentIndex ? 1 : -1;
                setDirection(newDir);
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              layout
            />
          ))}
          {/* 멈춤/재생 버튼 */}
          <motion.button
            className={classNames(styles.pauseBtn, { [styles.paused]: isPaused })}
            onClick={togglePause}
            aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isPaused ? (
                <motion.span
                  key="play"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Play size={12} fill="currentColor" />
                </motion.span>
              ) : (
                <motion.span
                  key="pause"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <Pause size={12} fill="currentColor" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </motion.header>
  );
}
