/**
 * KCL home client surface.
 *
 * The home keeps the current brand/header shell, while the vote surface uses
 * the legacy selection-first board. A ranking card selects a company; the
 * existing VoteController then owns voting inside the responsive panel.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { CompanyType } from '@/lib/mock-data';
import type { CompaniesResponse } from '@/types/api';
import { useLeagueData } from '@/hooks/useLeagueData';
import { useAuth } from '@/hooks/useAuth';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import { getSupabase } from '@/lib/supabase/client';
import HomeBoardHeader from '@/components/features/home/HomeBoardHeader';
import VoteBoard from '@/components/features/vote/VoteBoard';
import styles from './page.module.scss';

const BottomSheet = dynamic(() => import('@/components/ui/BottomSheet'), { ssr: false });
const VoteController = dynamic(() => import('@/components/features/VoteController'), {
  ssr: false,
});
const Modal = dynamic(() => import('@/components/common/Modal'), { ssr: false });

export {
  formatHomeDdayLabel,
  formatHomeSeasonLabel,
} from '@/components/features/home/HomeBoardHeader';
export { HOME_DIRECT_VOTE_UNIT, getDirectVoteAmount as getHomeDirectVoteAmount } from '@/lib/home-vote';

interface HomeClientProps {
  initialData?: CompaniesResponse | null;
}

interface EventModalCopy {
  title: string;
  lead: string;
  highlight: string;
  powerVoteTitle: string;
  powerVote: string;
  note: string;
  primaryCta: string;
  closeCta: string;
}

const EVENT_MODAL_COPY: Record<string, EventModalCopy> = {
  ko: {
    title: '오늘 비로그인 투표권을 모두 사용했어요',
    lead: '로그인하면 매일 더 많은 투표권으로 최애 소속사를 계속 응원할 수 있어요.',
    highlight: '비로그인 100표 / 로그인 300표 (매일)',
    powerVoteTitle: '파워투표',
    powerVote: '투표하기 버튼을 길게 눌러 한 번에 최대 100표까지 투표',
    note: '비로그인 투표권은 UTC 자정에 다시 충전됩니다.',
    primaryCta: '로그인 / 회원가입하기',
    closeCta: '닫기',
  },
  en: {
    title: 'You used all guest votes for today',
    lead: 'Sign in to keep supporting your favorite company with more daily voting power.',
    highlight: 'Guest 100 votes / Member 300 votes daily',
    powerVoteTitle: 'Power Vote',
    powerVote: 'Long-press Vote to cast up to 100 votes at once',
    note: 'Guest votes refresh at midnight UTC.',
    primaryCta: 'Log in / Sign up',
    closeCta: 'Close',
  },
};

function normalizeVoteDockCompany(value?: string | null) {
  return (value ?? '')
    .toLocaleLowerCase()
    .replace(/entertainment|records|label/g, '')
    .replace(/[^a-z0-9가-힣]/g, '');
}

function toCompanyTypeFromRanking(company: {
  companyId: string;
  nameEn: string;
  nameKo: string;
  artists: { en: string[]; ko: string[] };
  voteCount: number;
  rank: number;
  rankChange: number;
  gradientColor: string;
  logoUrl: string;
  subLabels?: Array<{
    id: string;
    nameEn: string;
    nameKo: string;
    artists: { en: string[]; ko: string[] };
  }>;
}): CompanyType {
  return {
    id: company.companyId,
    name: { en: company.nameEn, ko: company.nameKo },
    representative: company.artists,
    firepower: company.voteCount,
    rank: company.rank,
    change: company.rankChange > 0 ? 'up' : company.rankChange < 0 ? 'down' : 'same',
    image: company.gradientColor.startsWith('linear-gradient')
      ? company.gradientColor
      : `linear-gradient(135deg, ${company.gradientColor} 0%, #1A1A1A 100%)`,
    logoUrl: company.logoUrl || undefined,
    stockHistory: [],
    subLabels: company.subLabels,
  };
}

/** Restore the legacy selection/panel flow while retaining the current home shell. */
export function HomeClient({ initialData }: HomeClientProps = {}) {
  const locale = useLocale();
  const { user, profile, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const {
    premierLeague,
    allCompanies,
    season,
    isLoading,
    error,
    refresh,
  } = useLeagueData({
    refreshInterval: 20000,
    fallbackData: initialData ?? undefined,
  });
  const { quota, refetchStats } = useVoteQuota(user?.id);
  const { countdown, isRefreshing } = useRefreshCountdown({
    intervalMs: 20000,
    refreshingDurationMs: 1500,
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedSubLabelId, setSelectedSubLabelId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const didAutoSelectCompany = useRef(false);
  const didApplyVoteDockSelection = useRef(false);

  const eventModalCopy = EVENT_MODAL_COPY[locale] ?? EVENT_MODAL_COPY.en;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    const ranking = allCompanies.find((company) => company.companyId === selectedCompanyId);
    return ranking ? toCompanyTypeFromRanking(ranking) : null;
  }, [allCompanies, selectedCompanyId]);

  useEffect(() => {
    if (didApplyVoteDockSelection.current || allCompanies.length === 0) return;

    const requestedCompany = new URLSearchParams(window.location.search).get('voteCompany');
    didApplyVoteDockSelection.current = true;
    if (!requestedCompany) return;

    const normalizedRequest = normalizeVoteDockCompany(requestedCompany);
    const matchedCompany = allCompanies.find((company) =>
      [company.companyId, company.companyName, company.nameEn, company.nameKo].some(
        (candidate) => normalizeVoteDockCompany(candidate) === normalizedRequest,
      ),
    );
    if (!matchedCompany) return;

    didAutoSelectCompany.current = true;
    setSelectedCompanyId(matchedCompany.companyId);
    setSelectedSubLabelId(null);
    setSelectedArtistName(null);
    const shouldOpenBottomSheet = window.innerWidth < 1024;
    setIsMobile(shouldOpenBottomSheet);
    if (shouldOpenBottomSheet) {
      setIsSheetOpen(true);
    } else {
      window.requestAnimationFrame(() => {
        document.getElementById('vote-station')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    }
  }, [allCompanies]);

  useEffect(() => {
    if (didAutoSelectCompany.current || selectedCompanyId || isAuthLoading) return;
    if (isAuthenticated && !profile) return;
    if (!profile?.favorite_group_id || allCompanies.length === 0) {
      didAutoSelectCompany.current = true;
      return;
    }

    const selectFavoriteCompany = async () => {
      try {
        const supabase = getSupabase();
        const { data: groupData, error: groupError } = await supabase
          .from('kcl_groups')
          .select('company_id, name_en')
          .eq('id', profile.favorite_group_id)
          .single();

        if (groupError || !groupData?.company_id) return;

        const directMatch = allCompanies.find(
          (company) => company.companyId === groupData.company_id,
        );
        if (directMatch) {
          setSelectedCompanyId(directMatch.companyId);
          setSelectedArtistName(groupData.name_en || null);
          return;
        }

        const { data: companyData } = await supabase
          .from('kcl_companies')
          .select('parent_company_id')
          .eq('id', groupData.company_id)
          .single();
        const parentMatch = allCompanies.find(
          (company) => company.companyId === companyData?.parent_company_id,
        );
        if (parentMatch) {
          setSelectedCompanyId(parentMatch.companyId);
          setSelectedSubLabelId(groupData.company_id);
          setSelectedArtistName(groupData.name_en || null);
        }
      } catch {
        // A missing favorite-group lookup must not block the public vote board.
      } finally {
        didAutoSelectCompany.current = true;
      }
    };

    void selectFavoriteCompany();
  }, [allCompanies, isAuthLoading, isAuthenticated, profile, selectedCompanyId]);

  const handleVote = useCallback(
    (companyId: string, artistName?: string | null) => {
      if (!allCompanies.some((company) => company.companyId === companyId)) return;

      didAutoSelectCompany.current = true;
      setSelectedCompanyId(companyId);
      setSelectedSubLabelId(null);
      setSelectedArtistName(artistName ?? null);
      if (isMobile) setIsSheetOpen(true);
    },
    [allCompanies, isMobile],
  );

  const handleVoteSuccess = useCallback(() => {
    void refetchStats();
    void refresh();
  }, [refetchStats, refresh]);

  const handleGuestQuotaExhausted = useCallback(() => {
    if (isAuthLoading || isAuthenticated) return;
    setIsSheetOpen(false);
    setIsEventModalOpen(true);
  }, [isAuthLoading, isAuthenticated]);

  if (isLoading && allCompanies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading league data...</p>
      </div>
    );
  }

  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load data</p>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <HomeBoardHeader
        season={season}
        quotaRemaining={quota.remaining}
        countdown={countdown}
        isRefreshing={isRefreshing}
      />

      <VoteBoard
        premierLeague={premierLeague}
        allCompanies={allCompanies}
        selectedCompanyId={selectedCompanyId}
        selectedCompany={selectedCompany}
        selectedSubLabelId={selectedSubLabelId}
        selectedArtistName={selectedArtistName}
        isExpanded={isExpanded}
        isSheetOpen={isSheetOpen}
        isMobile={isMobile}
        onVote={handleVote}
        onVoteSuccess={handleVoteSuccess}
        onGuestQuotaExhausted={handleGuestQuotaExhausted}
        onToggleExpand={() => setIsExpanded((current) => !current)}
        onSheetClose={() => setIsSheetOpen(false)}
        voteControllerComponent={VoteController}
        bottomSheetComponent={BottomSheet}
        panelId="vote-station"
        layoutClassName=""
        showLeagueHeader={false}
        showSearchBar={false}
      />

      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={eventModalCopy.title}
      >
        <div className={styles.eventModalContent}>
          <p className={styles.eventModalLead}>{eventModalCopy.lead}</p>
          <div className={styles.eventModalBenefitCard}>
            <ul className={styles.eventBenefitList}>
              <li className={styles.eventBenefitItem}>
                <p className={styles.eventModalHighlight}>{eventModalCopy.highlight}</p>
              </li>
              <li className={styles.eventBenefitItem}>
                <p className={styles.eventBenefitTitle}>{eventModalCopy.powerVoteTitle}</p>
                <p className={styles.eventModalPowerVote}>{eventModalCopy.powerVote}</p>
              </li>
            </ul>
          </div>
          <p className={styles.eventModalNote}>{eventModalCopy.note}</p>
          <div className={styles.eventModalActions}>
            <Link href={`/${locale}/signup`} className={styles.eventPrimaryBtn}>
              {eventModalCopy.primaryCta}
            </Link>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className={styles.eventDismissBtn}
            >
              {eventModalCopy.closeCta}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default HomeClient;
