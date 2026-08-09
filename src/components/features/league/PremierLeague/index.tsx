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

import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames';
import type { CompanyRanking } from '@/types/league';
import TopThreeCard from '../TopThreeCard';
import LeagueRankingItem from '../LeagueRankingItem';
import KpopfaceAdCard from '../KpopfaceAdCard';
import styles from './PremierLeague.module.scss';

interface PremierLeagueProps {
  /** 1부 리그 소속사들 (1-10위) */
  companies: CompanyRanking[];
  /** 투표 핸들러 */
  onVote: (companyId: string) => void;
  /** 선택된 회사 ID (배틀스테이션에 표시 중인 회사) */
  selectedCompanyId?: string | null;
  /** Kpopface 프로모션 슬롯 표시 여부 (메인 화면은 기본 표시) */
  showKpopfaceAd?: boolean;
  /** iframe surfaces can keep the familiar compact ranking density. */
  compact?: boolean;
}

export default function PremierLeague({
  companies,
  onVote,
  selectedCompanyId,
  showKpopfaceAd = true,
  compact = false,
}: PremierLeagueProps) {
  // T1.XX: 배열 index 기준으로 분류 (rank는 전체 firepower 순위라서 사용 불가)
  // companies는 이미 firepower 순으로 정렬되어 있음
  const top3 = companies.slice(0, 3); // 처음 3개 = 1, 2, 3위
  const rank4to10 = companies.slice(3, 10); // 나머지 = 4~10위

  return (
    <section className={classNames(styles.premierLeague, { [styles.compact]: compact })}>
      {/* Top 3 대형 카드 */}
      <div className={styles.topThreeGrid}>
        {top3.map((company, index) => (
          <TopThreeCard
            key={company.companyId}
            company={company}
            rank={(index + 1) as 1 | 2 | 3}
            onVote={() => onVote(company.companyId)}
            isSelected={selectedCompanyId === company.companyId}
            compact={compact}
          />
        ))}
      </div>

      {/* 4위 목록 위 Kpopface 프로모션 슬롯 */}
      {showKpopfaceAd && <KpopfaceAdCard compact={compact} />}

      {/* 4-10위 리스트 - T1.16: 10위도 일반 표시 */}
      {/* T1.XX: AnimatePresence 추가 - 순위 변동 시 새 아이템 애니메이션 처리 */}
      <div className={styles.rankingList}>
        <AnimatePresence mode="popLayout" initial={false}>
          {rank4to10.map((company, index) => (
            <motion.div
              key={company.companyId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.2,
                layout: {
                  duration: 0.4,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              layout
            >
              <LeagueRankingItem
                company={company}
                onVote={onVote}
                displayRank={index + 4}
                isSelected={selectedCompanyId === company.companyId}
                compact={compact}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* T1.16: 10위 강등 위기 강조 제거 - SeasonHeader의 승강전 영역으로 통합 */}
    </section>
  );
}
