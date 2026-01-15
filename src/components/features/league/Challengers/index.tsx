/**
 * Challengers
 *
 * 2부 리그 탭 콘텐츠 컴포넌트
 * - 11위~ 리스트 (일반 표시)
 * - 더 보기 버튼 (페이지네이션)
 *
 * @updated T1.16 - 11위 승격 기회 강조 제거 (SeasonHeader로 통합)
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
}

export default function Challengers({ companies, onVote, onLoadMore, hasMore }: ChallengersProps) {
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
      <motion.div
        className={styles.rankingList}
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.2 },
          },
        }}
      >
        {companies.map((company) => (
          <motion.div
            key={company.companyId}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
          >
            <LeagueRankingItem company={company} onVote={onVote} />
          </motion.div>
        ))}
      </motion.div>

      {/* 더 보기 버튼 */}
      {hasMore && (
        <motion.button
          className={styles.loadMoreButton}
          onClick={onLoadMore}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>{t('show_more')}</span>
          <ChevronDown size={18} />
        </motion.button>
      )}
    </section>
  );
}
