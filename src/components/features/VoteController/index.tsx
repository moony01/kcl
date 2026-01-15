/**
 * VoteController
 *
 * 투표 인터페이스 모듈화 컴포넌트
 * BottomSheet(모바일)와 StickyPanel(데스크톱)에서 공통으로 사용됩니다.
 *
 * 기능:
 * - 선택된 소속사 정보 표시
 * - 아티스트 칩(Chips) 선택 UI
 * - 대형 투표 버튼 + 파티클 효과
 * - 현재 화력 점수 표시
 * - 투표권 상태 표시 (VoteQuotaBar)
 *
 * T1.8.2 변경사항:
 * - 1회 투표 = 1점 (기존 100점에서 변경)
 * - 일일 투표권 30회 제한
 * - 투표권 소진 시 버튼 비활성화
 */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Check, Timer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import { CompanyType } from '@/lib/mock-data';
import { useVote } from '@/hooks/useVote';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import VoteQuotaBar from '@/components/features/vote/VoteQuotaBar';
import styles from './VoteController.module.scss';

interface VoteControllerProps {
  /** 선택된 회사 데이터 */
  company: CompanyType | null;
  /** 검색에서 선택된 아티스트 (선택) */
  selectedArtist?: string;
  /** 투표 성공 시 콜백 (리스트 하이라이트용) */
  onVoteSuccess?: (companyId: string) => void;
  /** 표시 변형 - PC: full, Mobile: compact */
  variant?: 'full' | 'compact';
}

export default function VoteController({
  company,
  selectedArtist,
  onVoteSuccess,
  variant = 'full',
}: VoteControllerProps) {
  const t = useTranslations('Vote');
  const { submitVote, isLoading } = useVote();
  const { quota, useVote: consumeVote, isLoading: isQuotaLoading } = useVoteQuota();

  // 선택된 아티스트 상태 (초기값은 props에서 전달받거나 첫번째 아티스트)
  const [chosenArtist, setChosenArtist] = useState<string | null>(selectedArtist || null);
  const [showSuccess, setShowSuccess] = useState(false);

  // 아티스트 목록 (영어 기준)
  const artists = company?.representative.en || [];

  // props로 전달받은 selectedArtist가 변경되면 반영
  if (selectedArtist && selectedArtist !== chosenArtist) {
    setChosenArtist(selectedArtist);
  }

  // 투표 핸들러
  const handleVote = useCallback(async () => {
    if (!company || isLoading || !quota.canVote) return;

    const success = await submitVote(company.id, company.image);
    if (success) {
      // 투표권 차감
      consumeVote();
      setShowSuccess(true);
      onVoteSuccess?.(company.id);

      // 성공 애니메이션 후 리셋
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    }
  }, [company, isLoading, quota.canVote, submitVote, consumeVote, onVoteSuccess]);

  // 회사가 선택되지 않았을 때
  if (!company) {
    return (
      <div className={styles.emptyState}>
        <Flame size={48} className={styles.emptyIcon} />
        <p>{t('select_artist')}</p>
      </div>
    );
  }

  return (
    <div className={styles.voteController}>
      {/* 회사 정보 헤더 */}
      <div className={styles.companyHeader}>
        <div className={styles.companyLogo} style={{ background: company.image }}>
          {company.name.en.charAt(0)}
        </div>
        <div className={styles.companyInfo}>
          <h3 className={styles.companyName}>{company.name.en}</h3>
          <div className={styles.firepowerBadge}>
            <Zap size={14} />
            <span>{company.firepower.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 아티스트 질문 */}
      <div className={styles.questionSection}>
        <p className={styles.question}>{t('who_fan')}</p>

        {/* 아티스트 칩 선택 */}
        <div className={styles.artistChips}>
          {artists.map((artist) => (
            <button
              key={artist}
              className={classNames(styles.chip, {
                [styles.selected]: chosenArtist === artist,
              })}
              onClick={() => setChosenArtist(artist)}
            >
              {chosenArtist === artist && (
                <motion.span
                  className={styles.checkIcon}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Check size={12} />
                </motion.span>
              )}
              {artist}
            </button>
          ))}
        </div>
      </div>

      {/* 대형 투표 버튼 */}
      <motion.button
        className={classNames(styles.voteButton, {
          [styles.disabled]: !quota.canVote,
        })}
        onClick={handleVote}
        disabled={isLoading || !quota.canVote}
        whileHover={quota.canVote ? { scale: 1.02 } : {}}
        whileTap={quota.canVote ? { scale: 0.95 } : {}}
        style={{
          background: showSuccess
            ? 'var(--color-secondary)'
            : !quota.canVote
              ? 'var(--color-text-dim)'
              : company.image,
        }}
      >
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
              <span>+1</span>
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
              <Flame size={28} />
              <span>{isLoading ? 'Sending...' : t('button.vote')}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 투표권 상태 바 */}
      {!isQuotaLoading && (
        <VoteQuotaBar
          used={quota.used}
          max={quota.max}
          hoursUntilReset={quota.hoursUntilReset}
          minutesUntilReset={quota.minutesUntilReset}
          variant={variant}
        />
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
