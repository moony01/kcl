/**
 * PromotionBattle
 *
 * 승강전 영역 컴포넌트 (항상 표시)
 * - 10위 vs 11위 대결 구도 시각화
 * - GAP 표시 (투표 수 격차)
 * - 양쪽 투표 버튼
 * - ⚔️ 아이콘, 긴장감 연출 (펄스 애니메이션)
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Swords, Flame, TrendingDown, TrendingUp } from 'lucide-react';
import type { PromotionBattle as PromotionBattleType } from '@/types/league';
import styles from './PromotionBattle.module.scss';

interface PromotionBattleProps {
  /** 승강전 정보 (10위 vs 11위) */
  battle: PromotionBattleType;
  /** 투표 핸들러 */
  onVote: (companyId: string) => void;
}

export default function PromotionBattle({ battle, onVote }: PromotionBattleProps) {
  const t = useTranslations('League.promotion_battle');

  const { relegationCompany, promotionCompany, gap } = battle;

  return (
    <section className={styles.battleSection}>
      {/* 섹션 타이틀 */}
      <div className={styles.header}>
        <motion.div
          className={styles.swordsIcon}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <Swords size={20} />
        </motion.div>
        <h2 className={styles.title}>{t('title')}</h2>
        <span className={styles.subtitle}>PROMOTION BATTLE</span>
      </div>

      {/* 대결 구도 */}
      <div className={styles.battleArena}>
        {/* 10위 (강등 위기) - 왼쪽 */}
        <motion.div
          className={styles.companyCard}
          data-zone="relegation"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.zoneTag}>
            <TrendingDown size={12} />
            <span>10위 강등 위기</span>
          </div>
          <div className={styles.logo} style={{ background: relegationCompany.gradientColor }}>
            {relegationCompany.nameEn.charAt(0)}
          </div>
          <h3 className={styles.companyName}>{relegationCompany.nameEn}</h3>
          <p className={styles.voteCount}>
            <Flame size={14} />
            {relegationCompany.voteCount.toLocaleString()}
          </p>
          <button className={styles.voteButton} onClick={() => onVote(relegationCompany.companyId)}>
            {t('button') || '투표하기'}
          </button>
        </motion.div>

        {/* GAP 영역 (중앙) */}
        <div className={styles.gapSection}>
          <motion.div
            className={styles.gapBadge}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className={styles.gapLabel}>{t('gap')}</span>
            <span className={styles.gapValue}>{gap.toLocaleString()}</span>
          </motion.div>
          <div className={styles.vsIcon}>
            <Swords size={24} />
          </div>
        </div>

        {/* 11위 (승격 기회) - 오른쪽 */}
        <motion.div
          className={styles.companyCard}
          data-zone="promotion"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={styles.zoneTag}>
            <TrendingUp size={12} />
            <span>11위 승격 기회</span>
          </div>
          <div className={styles.logo} style={{ background: promotionCompany.gradientColor }}>
            {promotionCompany.nameEn.charAt(0)}
          </div>
          <h3 className={styles.companyName}>{promotionCompany.nameEn}</h3>
          <p className={styles.voteCount}>
            <Flame size={14} />
            {promotionCompany.voteCount.toLocaleString()}
          </p>
          <button className={styles.voteButton} onClick={() => onVote(promotionCompany.companyId)}>
            {t('button') || '투표하기'}
          </button>
        </motion.div>
      </div>

      {/* CTA 메시지 */}
      <motion.p
        className={styles.ctaMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {t('gap_message', { count: gap.toLocaleString() })}
      </motion.p>
    </section>
  );
}
