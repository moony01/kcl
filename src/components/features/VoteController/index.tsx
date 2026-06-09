/**
 * VoteController
 *
 * 투표 인터페이스 모듈화 컴포넌트
 * BottomSheet(모바일)와 StickyPanel(데스크톱)에서 공통으로 사용됩니다.
 *
 * 기능:
 * - 선택된 소속사 정보 표시
 * - CompactSelect 기반 서브레이블/아티스트 선택 UI
 * - 대형 투표 버튼 + 파티클 효과
 * - 현재 화력 점수 표시
 * - 투표권 상태 표시 (VoteQuotaBar)
 *
 * T1.8.2: 1회 투표 = 1점, 일일 100회 제한
 * T2.0: CompactSelect UI
 * 2026-06: 비회원/회원 모두 롱프레스 파워투표 최대 x100 지원
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Check, Timer, Crown, Sparkles, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import classNames from 'classnames';
import { CompanyType } from '@/lib/mock-data';
import { FEATURES } from '@/config/features';
import { VOTE_LIMITS } from '@/config/vote';
import { useVote } from '@/hooks/useVote';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import { useAuth } from '@/hooks/useAuth';
import VoteQuotaBar from '@/components/features/vote/VoteQuotaBar';
import CompactSelect from '@/components/ui/CompactSelect';
import styles from './VoteController.module.scss';

/** 파워투표 설정 상수 */
const POWER_VOTE = {
  /** 롱프레스 감지 딜레이 (ms) - 이 시간 이상 누르면 파워투표 시작 */
  HOLD_DELAY: 400,
  /** 최대 파워 레벨 - 모든 사용자 공통 최대 x100 */
  MAX_LEVEL: VOTE_LIMITS.POWER_MAX,
  /** 풀충전 시간 (ms) */
  FULL_CHARGE_MS: 3000,
} as const;

interface VoteControllerProps {
  /** 선택된 회사 데이터 */
  company: CompanyType | null;
  /** 검색에서 선택된 아티스트 (선택) */
  selectedArtist?: string;
  /** T1.102: 최애 그룹 기반 자동 선택 산하 레이블 ID */
  autoSelectedSubLabelId?: string | null;
  /** 투표 성공 시 콜백 (리스트 하이라이트용) */
  onVoteSuccess?: (companyId: string) => void;
  /** 표시 변형 - PC: full, Mobile: compact */
  variant?: 'full' | 'compact';
}

export default function VoteController({
  company,
  selectedArtist,
  autoSelectedSubLabelId,
  onVoteSuccess,
  variant = 'full',
}: VoteControllerProps) {
  const t = useTranslations('Vote');
  const tPro = useTranslations('Pro');
  const locale = useLocale();
  const { user, profile } = useAuth();
  const { submitVote, isLoading } = useVote();
  // 2026-06: 로그인 회원 300표, 비로그인 100표 (운영 override는 서버 dailyLimit 반영)
  const { quota, useVote: consumeVote, isLoading: isQuotaLoading } = useVoteQuota(user?.id);

  // 선택된 아티스트 상태 (초기값은 props에서 전달받거나 첫번째 아티스트)
  const [chosenArtist, setChosenArtist] = useState<string | null>(selectedArtist || null);
  const [showSuccess, setShowSuccess] = useState(false);
  /** Pro 업그레이드 소진 팝업 표시 여부 */
  const [showExhaustedProPopup, setShowExhaustedProPopup] = useState(false);
  /** 마지막 투표 점수 (성공 애니메이션에 표시) */
  const [lastScore, setLastScore] = useState(1);

  // 모든 사용자가 롱프레스 파워투표를 사용할 수 있습니다. (최대 x100)
  const isPro = !!profile?.is_pro;
  const isLoggedIn = !!user;
  /** 로그인 회원이지만 Pro가 아닌 경우 — legacy Pro feature flag가 켜진 경우에만 힌트/팝업 표시 */
  const isLoggedInNonPro = isLoggedIn && !isPro;
  const showProPromos = FEATURES.PRO_SUBSCRIPTION && isLoggedInNonPro;
  const maxPowerLevel = POWER_VOTE.MAX_LEVEL;
  /** 파워투표 가능 여부 */
  const canPowerVote = maxPowerLevel > 1 && quota.remaining > 1;
  const stepInterval = Math.max(16, Math.round(POWER_VOTE.FULL_CHARGE_MS / Math.max(maxPowerLevel - 1, 1)));

  // T1.75: 선택된 서브레이블 상태 (null = 전체)
  const [selectedSubLabel, setSelectedSubLabel] = useState<string | null>(null);

  // T1.85: 파워투표 게이지 상태
  /** 현재 파워 레벨 (0 = 누르지 않은 상태, 1~100 = 게이지) */
  const [powerLevel, setPowerLevel] = useState(0);
  /** 롱프레스 진행 중 여부 */
  const [isPressing, setIsPressing] = useState(false);
  /** 롱프레스 타이머 ref */
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 게이지 증가 인터벌 ref */
  const gaugeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** 터치 시작 시간 (탭 vs 롱프레스 구분) */
  const pressStartRef = useRef<number>(0);
  /** pointerup 시 React state stale 값을 피하기 위한 최신 파워 레벨 */
  const powerLevelRef = useRef<number>(0);

  // T1.75: 서브레이블 유무 판단
  const hasSubLabels = FEATURES.SUB_LABEL_VOTING && (company?.subLabels?.length ?? 0) > 0;

  // T1.75/T1.102: 소속사 변경 시 서브레이블/아티스트 선택 초기화 (자동 선택값 반영)
  useEffect(() => {
    // 자동 선택된 산하 레이블이 있고 현재 회사의 서브레이블에 존재하면 적용
    if (autoSelectedSubLabelId && company?.subLabels?.some((sub) => sub.id === autoSelectedSubLabelId)) {
      setSelectedSubLabel(autoSelectedSubLabelId);
    } else {
      setSelectedSubLabel(null);
    }
    setChosenArtist(selectedArtist || null);
  }, [company, selectedArtist, autoSelectedSubLabelId]);

  // T1.75: 서브레이블 선택에 따라 아티스트 필터링
  const artists = useMemo(() => {
    if (!company) return [];

    if (!hasSubLabels || !selectedSubLabel) {
      return company.representative.en;
    }

    const subLabel = company.subLabels?.find((sub) => sub.id === selectedSubLabel);
    return subLabel?.artists.en || company.representative.en;
  }, [company, hasSubLabels, selectedSubLabel]);

  // props로 전달받은 selectedArtist가 변경되면 반영
  if (selectedArtist && selectedArtist !== chosenArtist) {
    setChosenArtist(selectedArtist);
  }

  /**
   * 투표 실행 (지정된 votePower로 제출)
   */
  const executeVote = useCallback(
    async (votePower: number) => {
      if (!company || isLoading || !quota.canVote) return;

      // 남은 투표권과 최대 파워 레벨을 넘지 않도록 안전하게 보정
      const maxAllowedPower = Math.min(maxPowerLevel, quota.remaining);
      const normalizedVotePower = Math.min(Math.max(votePower, 1), maxAllowedPower);

      if (normalizedVotePower <= 0) return;

      const result = await submitVote({
        companyId: company.id,
        companyColor: company.image,
        userId: user?.id,
        votePower: normalizedVotePower,
      });

      if (result?.success) {
        const consumed = result.voteScore || normalizedVotePower;
        consumeVote(consumed);
        setLastScore(consumed);
        setShowSuccess(true);
        onVoteSuccess?.(company.id);

        // 투표 후 남은 투표권이 0이 되면 legacy Pro 팝업 표시 (feature flag가 켜진 경우만)
        if (showProPromos && quota.remaining - consumed <= 0) {
          setShowExhaustedProPopup(true);
        }

        setTimeout(() => {
          setShowSuccess(false);
        }, 1500);
      }
    },
    [company, isLoading, quota.canVote, quota.remaining, maxPowerLevel, submitVote, consumeVote, onVoteSuccess, user?.id, showProPromos],
  );

  /**
   * 타이머 정리 유틸
   */
  const clearTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (gaugeIntervalRef.current) {
      clearInterval(gaugeIntervalRef.current);
      gaugeIntervalRef.current = null;
    }
  }, []);

  /**
   * 롱프레스 시작 (pointerdown)
   *
   * 버튼을 누르면:
   * 1. HOLD_DELAY 후 파워투표 모드 진입
   * 2. stepInterval마다 게이지 1칸씩 증가 (최대 100, 남은 투표권 상한)
   */
  const handlePointerDown = useCallback(() => {
    const maxChargePower = Math.min(maxPowerLevel, quota.remaining);
    if (!company || isLoading || !quota.canVote || maxChargePower <= 0) return;

    pressStartRef.current = Date.now();
    powerLevelRef.current = 0;
    setIsPressing(true);

    // HOLD_DELAY 후 파워투표 모드 진입
    holdTimerRef.current = setTimeout(() => {
      let level = 1;
      powerLevelRef.current = level;
      setPowerLevel(level);

      // 남은 투표권이 1이면 추가 충전 없이 1표에서 고정
      if (maxChargePower <= 1) {
        return;
      }

      // 게이지 증가 인터벌
      gaugeIntervalRef.current = setInterval(() => {
        level = Math.min(level + 1, maxChargePower);
        powerLevelRef.current = level;
        setPowerLevel(level);

        // 최대 레벨 도달 시 인터벌 중지 (자동 투표하지 않음, 놓을 때까지 대기)
        if (level >= maxChargePower && gaugeIntervalRef.current) {
          clearInterval(gaugeIntervalRef.current);
          gaugeIntervalRef.current = null;
        }
      }, stepInterval);
    }, POWER_VOTE.HOLD_DELAY);
  }, [company, isLoading, quota.canVote, quota.remaining, maxPowerLevel, stepInterval]);

  /**
   * 롱프레스 종료 (pointerup / pointerleave)
   *
   * - 짧은 탭 (< HOLD_DELAY): 1표 일반 투표
   * - 롱프레스: 현재 파워 레벨만큼 투표
   */
  const handlePointerUp = useCallback(() => {
    if (!isPressing) return;

    const pressDuration = Date.now() - pressStartRef.current;
    clearTimers();
    setIsPressing(false);
    const finalPower = powerLevelRef.current;
    powerLevelRef.current = 0;

    if (pressDuration < POWER_VOTE.HOLD_DELAY) {
      // 짧은 탭 → 1표 일반 투표
      setPowerLevel(0);
      executeVote(1);
    } else if (finalPower > 0) {
      // 롱프레스 → 파워 레벨만큼 투표
      setPowerLevel(0);
      executeVote(finalPower);
    } else {
      setPowerLevel(0);
    }
  }, [isPressing, clearTimers, executeVote]);

  /**
   * 포인터가 버튼을 벗어나면 취소
   */
  const handlePointerLeave = useCallback(() => {
    if (isPressing) {
      clearTimers();
      setIsPressing(false);
      powerLevelRef.current = 0;
      setPowerLevel(0);
    }
  }, [isPressing, clearTimers]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);


  // 회사가 선택되지 않았을 때
  if (!company) {
    return (
      <div className={styles.emptyState}>
        <Flame size={48} className={styles.emptyIcon} />
        <p>{t('select_artist')}</p>
      </div>
    );
  }

  /** 파워투표 게이지 진행률 (%) */
  const gaugeFill = (powerLevel / maxPowerLevel) * 100;

  return (
    <div className={styles.voteController}>
      {/* 회사 정보 헤더 */}
      <div className={styles.companyHeader}>
        <div className={styles.companyLogo} style={{ background: company.image }}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name.en} className={styles.logoImage} />
          ) : (
            company.name.en.charAt(0)
          )}
        </div>
        <div className={styles.companyInfo}>
          <h3 className={styles.companyName}>{company.name.en}</h3>
          <div className={styles.firepowerBadge}>
            <Zap size={14} />
            <span>{company.firepower.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* T2.0: 서브레이블 CompactSelect */}
      {hasSubLabels && company.subLabels && (
        <CompactSelect
          label={t('sub_label_title')}
          value={selectedSubLabel}
          onChange={(val) => {
            setSelectedSubLabel(val);
            setChosenArtist(null);
          }}
          options={company.subLabels.map((sub) => ({ value: sub.id, label: sub.nameEn }))}
          showAllOption={true}
          allOptionLabel={t('sub_label_all')}
        />
      )}

      {/* T2.0: 아티스트 CompactSelect */}
      <div className={styles.questionSection}>
        <CompactSelect
          label={t('who_fan')}
          value={chosenArtist}
          onChange={setChosenArtist}
          options={artists.map((a) => ({ value: a, label: a }))}
          placeholder={t('select_artist')}
          clearable={true}
        />
      </div>

      {/* T1.85: 대형 투표 버튼 + 롱프레스 파워투표 게이지 */}
      <div className={styles.voteButtonWrapper}>
        <motion.button
          className={classNames(styles.voteButton, {
            [styles.disabled]: !quota.canVote,
            [styles.pressing]: isPressing && powerLevel > 0,
          })}
          disabled={isLoading || !quota.canVote}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()}
          whileHover={quota.canVote && !isPressing ? { scale: 1.02 } : {}}
          style={{
            background: showSuccess
              ? 'var(--color-secondary)'
              : !quota.canVote
                ? 'var(--color-text-dim)'
                : company.image,
          }}
        >
          {/* 파워투표 게이지 오버레이 */}
          {isPressing && powerLevel > 0 && (
            <div
              className={styles.gaugeOverlay}
              style={{ width: `${gaugeFill}%` }}
            />
          )}

          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                className={styles.successContent}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
              >
                <Check size={32} strokeWidth={3} />
                <span>+{lastScore}</span>
              </motion.div>
            ) : isPressing && powerLevel > 0 ? (
              <motion.div
                key="power"
                className={styles.powerContent}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Flame size={28} />
                <span className={styles.powerNumber}>x{powerLevel}</span>
              </motion.div>
            ) : !quota.canVote ? (
              <motion.div
                key="exhausted"
                className={styles.exhaustedContent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Timer size={28} />
                <span>{t('button.exhausted')}</span>
              </motion.div>
            ) : (
              <motion.div
                key="vote"
                className={styles.voteContent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.voteMain}>
                  <Flame size={28} />
                  <span>{isLoading ? 'Sending...' : t('button.vote')}</span>
                </div>
                {canPowerVote && (
                  <span className={styles.voteSubHint}>
                    {t('button.hold_hint', { max: maxPowerLevel, defaultValue: `Hold for Power Vote (x${maxPowerLevel})` })}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

      </div>

      {/* Fan Power Pass 업셀링 버튼 (로그인 비Pro 회원에게만 표시) */}
      {FEATURES.PRO_SUBSCRIPTION && showProPromos && (
        <Link href={`/${locale}/pro`} className={styles.fanPowerPassBtn}>
          <Crown size={15} className={styles.fanPowerPassBtnIcon} />
          <span className={styles.fanPowerPassBtnCta}>{tPro('upgrade_cta')}</span>
          <span className={styles.fanPowerPassBtnBadge}>{tPro('upgrade_desc')}</span>
        </Link>
      )}


      {/* 투표권 상태 바 */}
      {!isQuotaLoading && (
        <VoteQuotaBar
          used={quota.used}
          max={quota.max}
          hoursUntilReset={quota.hoursUntilReset}
          minutesUntilReset={quota.minutesUntilReset}
          variant={variant}
          mode={quota.mode}
          isLoggedIn={!!user}
          isPro={!!profile?.is_pro}
        />
      )}


      {/* ② 투표권 소진 Pro 업그레이드 모달 (로그인 비Pro 회원이 투표권 0이 됐을 때) */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showProPromos && showExhaustedProPopup && (
            <motion.div
              className={styles.proExhaustedOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowExhaustedProPopup(false)}
            >
              <motion.div
                className={styles.proExhaustedModal}
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={styles.proExhaustedClose}
                  onClick={() => setShowExhaustedProPopup(false)}
                  aria-label="close"
                >
                  <X size={16} />
                </button>
                <div className={styles.proExhaustedIcon}>
                  <Sparkles size={26} />
                </div>
                <p className={styles.proExhaustedTitle}>{t('button.pro_exhausted_title')}</p>
                <p className={styles.proExhaustedDesc}>{t('button.pro_exhausted_desc')}</p>
                <Link href={`/${locale}/pro`} className={styles.proExhaustedCta} onClick={() => setShowExhaustedProPopup(false)}>
                  {t('button.pro_exhausted_cta')}
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 선택된 아티스트 컨텍스트 */}
      {chosenArtist && (
        <motion.p
          className={styles.forArtist}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          For <strong>{chosenArtist}</strong>
        </motion.p>
      )}
    </div>
  );
}
