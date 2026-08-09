'use client';

import { useMemo } from 'react';
import type { ComponentType, ReactNode } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import type { CompanyType } from '@/lib/mock-data';
import type { CompanyRanking } from '@/types/league';
import StickyPanel from '@/components/ui/StickyPanel';
import SearchBar from '@/components/ui/SearchBar';
import PremierLeague from '@/components/features/league/PremierLeague';
import LeagueRankingItem from '@/components/features/league/LeagueRankingItem';
import { LeagueHeader } from '@/components/features/league/LeagueHeader';
import styles from '@/app/[locale]/page.module.scss';

export interface VoteControllerRenderProps {
  company: CompanyType | null;
  selectedArtist?: string;
  autoSelectedSubLabelId?: string | null;
  onVoteSuccess?: (companyId: string) => void;
  onGuestQuotaExhausted?: () => void;
}

export interface BottomSheetRenderProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  heightRatio?: number;
}

export interface VoteBoardProps {
  premierLeague: CompanyRanking[];
  allCompanies: CompanyRanking[];
  selectedCompanyId: string | null;
  selectedCompany: CompanyType | null;
  selectedSubLabelId?: string | null;
  selectedArtistName?: string | null;
  isExpanded: boolean;
  isSheetOpen: boolean;
  isMobile: boolean;
  onVote: (companyId: string, artistName?: string | null) => void;
  onSearchSelect?: (companyId: string, artistName?: string) => void;
  onVoteSuccess: (companyId?: string) => void;
  onGuestQuotaExhausted?: () => void;
  onToggleExpand: () => void;
  onSheetClose: () => void;
  voteControllerComponent: ComponentType<VoteControllerRenderProps>;
  bottomSheetComponent: ComponentType<BottomSheetRenderProps>;
  showKpopfaceAd?: boolean;
  /** Kpopface keeps its compact TOP 4 + “Show top 10” interaction. */
  compactTopTen?: boolean;
  expandLabel?: string;
  collapseLabel?: string;
  panelId?: string;
  testId?: string;
  surface?: string;
  /** standalone embed shell or an existing page shell (empty string) */
  layoutClassName?: string;
}

/**
 * KCL 메인 투표보드의 단일 UI 기준입니다.
 * 홈은 이 컴포넌트를 직접 렌더링하고, 외부 사용처는 vote-board embed를 iframe으로 사용합니다.
 */
export default function VoteBoard({
  premierLeague,
  allCompanies,
  selectedCompanyId,
  selectedCompany,
  selectedSubLabelId,
  selectedArtistName,
  isExpanded,
  isSheetOpen,
  isMobile,
  onVote,
  onSearchSelect,
  onVoteSuccess,
  onGuestQuotaExhausted,
  onToggleExpand,
  onSheetClose,
  voteControllerComponent: VoteController,
  bottomSheetComponent: BottomSheet,
  showKpopfaceAd = true,
  compactTopTen = false,
  expandLabel,
  collapseLabel,
  panelId,
  testId,
  surface,
  layoutClassName,
}: VoteBoardProps) {
  const companiesBelow11 = useMemo(() => allCompanies.slice(10), [allCompanies]);
  const companiesToReveal = compactTopTen ? [] : companiesBelow11;
  const displayedPremierLeague = compactTopTen && !isExpanded
    ? premierLeague.slice(0, 4)
    : premierLeague;
  const shouldShowExpansion = compactTopTen ? premierLeague.length > 4 : companiesBelow11.length > 0;
  const handleSearchSelect = onSearchSelect ?? onVote;
  const handleGuestQuotaExhausted = onGuestQuotaExhausted ?? onSheetClose;

  return (
    <div
      className={classNames(layoutClassName, {
        [styles.compactEmbed]: compactTopTen,
      })}
      data-surface={surface}
      data-ads={showKpopfaceAd ? 'on' : 'off'}
      data-testid={testId}
    >
      <div className={styles.leagueHeaderSection}>
        <LeagueHeader />
      </div>

      <div className={styles.searchSection}>
        <SearchBar onSelect={handleSearchSelect} />
      </div>

      <div className={styles.contentLayout}>
        <section className={styles.leagueListSection}>
          <PremierLeague
            companies={displayedPremierLeague}
            onVote={onVote}
            selectedCompanyId={selectedCompanyId}
            showKpopfaceAd={showKpopfaceAd}
            compact={compactTopTen}
          />

          {shouldShowExpansion && (
            <div className={styles.expandSection}>
              <AnimatePresence initial={false}>
                {isExpanded && companiesToReveal.length > 0 && (
                  <motion.div
                    key="below11"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className={styles.expandedList}
                    style={{ overflow: 'hidden' }}
                  >
                    {companiesToReveal.map((company) => (
                      <LeagueRankingItem
                        key={company.companyId}
                        company={company}
                        onVote={onVote}
                        displayRank={company.rank}
                        isSelected={selectedCompanyId === company.companyId}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                className={styles.expandToggleBtn}
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
              >
                <span>
                  {isExpanded
                    ? (collapseLabel || 'Collapse')
                    : (expandLabel || (compactTopTen ? 'Show top 10' : 'Show more'))}
                </span>
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </motion.svg>
              </button>
            </div>
          )}
        </section>

        <aside id={panelId} className={styles.panelColumn}>
          <StickyPanel isVisible title="Battle Station">
            <VoteController
              company={selectedCompany}
              onVoteSuccess={onVoteSuccess}
              onGuestQuotaExhausted={handleGuestQuotaExhausted}
              autoSelectedSubLabelId={selectedSubLabelId}
              selectedArtist={selectedArtistName || undefined}
            />
          </StickyPanel>
        </aside>
      </div>

      <BottomSheet isOpen={isSheetOpen && isMobile} onClose={onSheetClose} heightRatio={0.55}>
        <VoteController
          company={selectedCompany}
          onVoteSuccess={onVoteSuccess}
          onGuestQuotaExhausted={handleGuestQuotaExhausted}
          autoSelectedSubLabelId={selectedSubLabelId}
          selectedArtist={selectedArtistName || undefined}
        />
      </BottomSheet>
    </div>
  );
}
