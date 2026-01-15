/**
 * PremierLeague
 *
 * 1부 리그 탭 콘텐츠 컴포넌트
 * - Top 3 대형 카드 (가로 배치)
 * - 4-10위 리스트 (일반 표시)
 *
 * @updated T1.16 - 10위 강등 위기 강조 제거 (SeasonHeader로 통합)
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { CompanyRanking } from '@/types/league';
import TopThreeCard from '../TopThreeCard';
import LeagueRankingItem from '../LeagueRankingItem';
import styles from './PremierLeague.module.scss';

interface PremierLeagueProps {
  /** 1부 리그 소속사들 (1-10위) */
  companies: CompanyRanking[];
  /** 투표 핸들러 */
  onVote: (companyId: string) => void;
}

export default function PremierLeague({ companies, onVote }: PremierLeagueProps) {
  const t = useTranslations('League.premier');

  // 순위별 분류 - T1.16: 10위를 4-9위와 함께 일반 리스트로 표시
  const top3 = companies.filter((c) => c.rank <= 3);
  const rank4to10 = companies.filter((c) => c.rank >= 4 && c.rank <= 10);

  return (
    <section className={styles.premierLeague}>
      {/* 섹션 헤더 */}
      <header className={styles.header}>
        <Crown className={styles.icon} size={20} />
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{t('title')}</h2>
          <span className={styles.subtitle}>{t('subtitle')}</span>
        </div>
      </header>

      {/* Top 3 대형 카드 */}
      <div className={styles.topThreeGrid}>
        {top3.map((company) => (
          <TopThreeCard
            key={company.companyId}
            company={company}
            rank={company.rank as 1 | 2 | 3}
            onVote={() => onVote(company.companyId)}
          />
        ))}
      </div>

      {/* 4-10위 리스트 - T1.16: 10위도 일반 표시 */}
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
        {rank4to10.map((company) => (
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

      {/* T1.16: 10위 강등 위기 강조 제거 - SeasonHeader의 승강전 영역으로 통합 */}
    </section>
  );
}
