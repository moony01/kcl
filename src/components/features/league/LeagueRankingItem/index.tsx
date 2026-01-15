/**
 * LeagueRankingItem
 *
 * 리그 순위 리스트 아이템 컴포넌트
 * - 4-10위 (Premier), 12위~ (Challengers)용 컴팩트 디자인
 * - 강등 위기/승격 기회 강조 스타일
 * - 호버 시 투표 버튼 표시
 */

'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Minus, AlertTriangle, ArrowUp } from 'lucide-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { CompanyRanking } from '@/types/league';
import styles from './LeagueRankingItem.module.scss';

interface LeagueRankingItemProps {
  /** 소속사 정보 */
  company: CompanyRanking;
  /** 투표 핸들러 (Deprecated) */
  onVote?: (companyId: string) => void;
  /** 상세 페이지 이동 핸들러 (Deprecated) */
  onDetail?: (companyId: string) => void;
}

export default function LeagueRankingItem({
  company,
  onVote: _onVote,
  onDetail: _onDetail,
}: LeagueRankingItemProps) {
  const router = useRouter();
  const t = useTranslations('League');
  const locale = useLocale();

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

  return (
    <motion.article
      className={classNames(styles.item, {
        [styles.relegation]: company.isRelegationZone,
        [styles.promotion]: company.isPromotionZone,
      })}
      whileHover={{ x: 4 }}
      transition={{ duration: 0.15 }}
      onClick={() => _onVote?.(company.companyId)}
    >
      {/* 순위 */}
      <div className={styles.rank}>
        <span className={styles.rankNumber}>{company.rank}</span>
        {renderRankChange()}
      </div>

      {/* 회사 정보 */}
      <div className={styles.companyInfo}>
        <div className={styles.logo} style={{ background: company.gradientColor }}>
          {company.nameEn.charAt(0)}
        </div>
        <div className={styles.textInfo}>
          <h4 className={styles.companyName}>{company.nameEn}</h4>
          {/* 강등/승격 경고 메시지 */}
          {company.isRelegationZone && (
            <span className={styles.warningTag}>
              <AlertTriangle size={10} />
              강등 위기
            </span>
          )}
          {company.isPromotionZone && (
            <span className={styles.promotionTag}>
              <ArrowUp size={10} />
              승격 기회
            </span>
          )}
        </div>
      </div>

      {/* 투표 수 */}
      <div className={styles.voteInfo}>
        <span className={styles.voteCount}>
          <Flame size={12} />
          {company.voteCount.toLocaleString()}
        </span>
      </div>

      {/* 투표 버튼 -> 상세 보기 버튼 */}
      <button
        className={styles.voteButton}
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/${locale}/company/${company.companyId}`);
        }}
      >
        {t('view_details')}
      </button>
    </motion.article>
  );
}
