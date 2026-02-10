/**
 * Challengers
 *
 * 2부 리그 탭 콘텐츠 컴포넌트
 * - 11위~ 리스트 (일반 표시)
 * - 더 보기 버튼 (페이지네이션)
 *
 * @updated T1.16 - 11위 승격 기회 강조 제거 (SeasonHeader로 통합)
 * @updated T1.56 - 2부 리그 독립 순위 표기 (11위→1위, 12위→2위...)
 * @updated T1.57 - 순위 변동 시 렌더링 버그 수정 (Framer Motion 애니메이션 제거)
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Flame, ChevronDown } from 'lucide-react';
import type { CompanyRanking } from '@/types/league';
import LeagueRankingItem from '../LeagueRankingItem';
import styles from './Challengers.module.scss';

interface ChallengersProps {
  /** 2부 리그 소속사들 (11위~) */
  companies: CompanyRanking[];
  /** 투표 핸들러 */
  onVote: (companyId: string) => void;
  /** 더 보기 핸들러 */
  onLoadMore: () => void;
  /** 더 불러올 데이터 있는지 */
  hasMore: boolean;
  /** 선택된 회사 ID (배틀스테이션에 표시 중인 회사) */
  selectedCompanyId?: string | null;
}

export default function Challengers({
  companies,
  onVote,
  onLoadMore,
  hasMore,
  selectedCompanyId,
}: ChallengersProps) {
  const t = useTranslations('League.challengers');

  return (
    <section className={styles.challengers}>
      {/* 섹션 헤더 */}
      <header className={styles.header}>
        <Flame className={styles.icon} size={20} />
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{t('title')}</h2>
          <span className={styles.subtitle}>{t('subtitle')}</span>
        </div>
      </header>

      {/* T1.16: 11위 승격 기회 강조 제거 - SeasonHeader의 승강전 영역으로 통합 */}

      {/* 11위~ 리스트 - T1.16: 11위도 일반 표시 */}
      {/* T1.56: 2부 리그 독립 순위 (index + 1 = 리그 내 순위) */}
      {/* T1.45: layout 애니메이션 재도입 (AnimatePresence 없이 - T1.57 렌더링 버그 방지) */}
      <div className={styles.rankingList}>
        {companies.map((company, index) => (
          <motion.div
            key={company.companyId}
            layout
            transition={{
              layout: {
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              },
            }}
          >
            <LeagueRankingItem
              company={company}
              onVote={onVote}
              displayRank={index + 1}
              isSelected={selectedCompanyId === company.companyId}
            />
          </motion.div>
        ))}
      </div>

      {/* 더 보기 버튼 */}
      {hasMore && (
        <button className={styles.loadMoreButton} onClick={onLoadMore}>
          <span>{t('show_more')}</span>
          <ChevronDown size={18} />
        </button>
      )}
    </section>
  );
}
