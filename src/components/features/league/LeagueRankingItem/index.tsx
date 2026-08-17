/**
 * LeagueRankingItem
 *
 * 리그 순위 리스트 아이템 컴포넌트
 * - 4-10위 (Premier), 12위~ (Challengers)용 컴팩트 디자인
 * - 강등 위기/승격 기회 강조 스타일
 * - 호버 시 투표 버튼 표시
 *
 * @updated T1.28 - 11위(승격 존) 특별 강조 스타일 추가, i18n 텍스트 적용
 * @updated T1.56 - displayRank prop 추가 (2부 리그 독립 순위 표기)
 */

'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import type { CompanyRanking } from '@/types/league';
import { getCompanyLogoBackground } from '@/lib/company-logos';
import styles from './LeagueRankingItem.module.scss';

interface LeagueRankingItemProps {
  /** 소속사 정보 */
  company: CompanyRanking;
  /** 투표 핸들러 (Deprecated) */
  onVote?: (companyId: string) => void;
  /** 상세 페이지 이동 핸들러 (Deprecated) */
  onDetail?: (companyId: string) => void;
  /** UI에 표시할 순위 (2부 리그 독립 순위 등) - 없으면 company.rank 사용 */
  displayRank?: number;
  /** 배틀스테이션에 선택된 상태인지 */
  isSelected?: boolean;
  /** iframe surfaces can keep the familiar compact ranking density. */
  compact?: boolean;
  /** Legacy vote action rendered as a full-card overlay in direct mode. */
  directVote?: ReactNode;
}

export default function LeagueRankingItem({
  company,
  onVote: _onVote,
  onDetail: _onDetail,
  displayRank,
  isSelected = false,
  compact = false,
  directVote,
}: LeagueRankingItemProps) {
  const t = useTranslations('League');

  /** 순위 변동 렌더링 */
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
        <Minus size={10} />
      </span>
    );
  };

  // 2026년 개편: 승강 상태별 스타일 분기
  const promotionStatus = company.promotionStatus;
  const isPromotionHero = promotionStatus === 'promotion_direct';
  const logoBackground = getCompanyLogoBackground(company.companyId, company.nameEn, company.logoUrl);

  /**
   * 승강 상태별 태그 렌더링
   * - relegation_direct: 강등 직행 (빨간색)
   * - relegation_danger: 강등 위기 (오렌지색)
   * - promotion_direct: 승격 직행 (초록색)
   * - promotion_chance: 승격 기회 (골드색)
   */
  const renderPromotionTag = () => {
    switch (promotionStatus) {
      case 'relegation_direct':
        return (
          <span className={classNames(styles.statusTag, styles.relegationDirectTag)}>
            <ArrowDown size={10} />
            {t('premier.relegation_direct')}
          </span>
        );
      case 'relegation_danger':
        return (
          <span className={classNames(styles.statusTag, styles.relegationDangerTag)}>
            <AlertTriangle size={10} />
            {t('premier.relegation_danger')}
          </span>
        );
      case 'promotion_direct':
        return (
          <span className={classNames(styles.statusTag, styles.promotionDirectTag)}>
            <ArrowUp size={10} />
            {t('challengers.promotion_direct')}
          </span>
        );
      case 'promotion_chance':
        return (
          <span className={classNames(styles.statusTag, styles.promotionChanceTag)}>
            <Sparkles size={10} />
            {t('challengers.promotion_chance')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.article
      className={classNames(styles.item, {
        [styles.relegationDirect]: promotionStatus === 'relegation_direct',
        [styles.relegationDanger]: promotionStatus === 'relegation_danger',
        [styles.promotionDirect]: promotionStatus === 'promotion_direct',
        [styles.promotionChance]: promotionStatus === 'promotion_chance',
        // 기존 스타일 호환성 유지
        [styles.relegation]: promotionStatus === 'relegation_direct',
        [styles.promotion]: promotionStatus === 'promotion_direct' && !isPromotionHero,
        [styles.promotionHero]: isPromotionHero,
        [styles.selected]: isSelected,
        [styles.compact]: compact,
        // T1.45: 순위 변동 글로우 효과
        [styles.rankUpGlow]: company.rankChange > 0,
        [styles.rankDownGlow]: company.rankChange < 0,
      })}
      data-company-id={company.companyId}
      transition={{ duration: 0.15 }}
      onClick={directVote ? undefined : () => _onVote?.(company.companyId)}
    >
      {/* 순위 - T1.56: displayRank가 있으면 우선 사용 (2부 리그 독립 순위) */}
      <div className={styles.rank}>
        <span className={styles.rankNumber}>{displayRank ?? company.rank}</span>
        {renderRankChange()}
      </div>

      {/* 회사 정보 */}
      <div className={styles.companyInfo}>
        <div className={styles.logo} style={{ background: logoBackground }}>
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.nameEn} className={styles.logoImage} />
          ) : (
            company.nameEn.charAt(0)
          )}
        </div>
        <div className={styles.textInfo}>
          <h4 className={styles.companyName}>{company.nameEn}</h4>
          <span className={styles.voteCount}>
            <Flame size={12} />
            {company.voteCount.toLocaleString()}
          </span>
          {/* 2026년 개편: 승강 상태별 태그 표시 */}
          {renderPromotionTag()}
        </div>
      </div>

      {directVote}

    </motion.article>
  );
}
