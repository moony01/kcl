'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CompanyType } from '@/lib/mock-data';
import type { CompanyRanking } from '@/types/league';
import { useLeagueData } from '@/hooks/useLeagueData';
import BottomSheet from '@/components/ui/BottomSheet';
import VoteController from '@/components/features/VoteController';
import VoteBoard from '@/components/features/vote/VoteBoard';
import styles from '@/app/[locale]/page.module.scss';

export type VoteBoardSurface = 'kcl-modal' | 'kpopface' | 'partner';

export interface VoteBoardEmbedOptions {
  surface: VoteBoardSurface;
  showAds: boolean;
}

const EMBED_MESSAGE_SOURCE = 'kcl-kpopface-embed';

const TOP_TEN_COPY: Record<string, { expand: string; collapse: string }> = {
  ko: { expand: '10위까지 보기', collapse: '접기' },
  en: { expand: 'Show top 10', collapse: 'Collapse' },
  ja: { expand: '10位まで見る', collapse: '閉じる' },
  zh: { expand: '查看前10名', collapse: '收起' },
  es: { expand: 'Ver top 10', collapse: 'Cerrar' },
  fr: { expand: 'Voir le top 10', collapse: 'Réduire' },
  de: { expand: 'Top 10 anzeigen', collapse: 'Einklappen' },
};

const ALLOWED_SURFACES = new Set<VoteBoardSurface>(['kcl-modal', 'kpopface', 'partner']);

/**
 * Parse the small, intentionally allow-listed embed contract.
 * `ads=on` only enables the first-party Kpopface slot; it never accepts HTML or URLs.
 */
export function parseVoteBoardEmbedOptions(search: string): VoteBoardEmbedOptions {
  const params = new URLSearchParams(search);
  const requestedSurface = params.get('surface') as VoteBoardSurface | null;

  return {
    surface:
      requestedSurface && ALLOWED_SURFACES.has(requestedSurface) ? requestedSurface : 'partner',
    showAds: params.get('ads') === 'on',
  };
}

function toCompanyType(company: CompanyRanking): CompanyType {
  return {
    id: company.companyId,
    name: {
      en: company.nameEn,
      ko: company.nameKo,
    },
    representative: company.artists,
    firepower: company.voteCount,
    rank: company.rank,
    change: company.rankChange > 0 ? 'up' : company.rankChange < 0 ? 'down' : 'same',
    image: company.gradientColor.startsWith('linear-gradient')
      ? company.gradientColor
      : `linear-gradient(135deg, ${company.gradientColor} 0%, #1A1A1A 100%)`,
    logoUrl: company.logoUrl || undefined,
    stockHistory: [],
    subLabels: company.subLabels?.map((sub) => ({
      id: sub.id,
      nameEn: sub.nameEn,
      nameKo: sub.nameKo,
      artists: sub.artists,
    })),
  };
}

export default function VoteBoardEmbedClient({ locale }: { locale: string }) {
  const {
    premierLeague,
    allCompanies,
    isLoading,
    error,
    refresh,
  } = useLeagueData({ refreshInterval: 20000 });
  const [options, setOptions] = useState<VoteBoardEmbedOptions>({
    surface: 'partner',
    showAds: false,
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedSubLabelId, setSelectedSubLabelId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setOptions(parseVoteBoardEmbedOptions(window.location.search));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 1024);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (selectedCompanyId || allCompanies.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      setSelectedCompanyId(allCompanies[0].companyId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [allCompanies, selectedCompanyId]);

  // Keep partner iframes sized to the shared board. The host-side contract is
  // intentionally the same as the legacy Kpopface embed, so existing hosts do
  // not need to change their resize listener.
  const notifyResize = useCallback(() => {
    if (typeof window === 'undefined' || window.parent === window) return;

    const height = Math.ceil(
      containerRef.current?.getBoundingClientRect().height
      || document.documentElement.scrollHeight,
    );

    window.parent.postMessage(
      { source: EMBED_MESSAGE_SOURCE, type: 'resize', height },
      '*',
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const observer = container && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(notifyResize)
      : null;

    if (container && observer) observer.observe(container);
    const frame = window.requestAnimationFrame(notifyResize);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [notifyResize, isExpanded, isMobile, isSheetOpen, options.showAds, allCompanies.length]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    const company = allCompanies.find((item) => item.companyId === selectedCompanyId);
    return company ? toCompanyType(company) : null;
  }, [allCompanies, selectedCompanyId]);

  const handleVote = useCallback(
    (companyId: string, artistName?: string | null) => {
      if (!allCompanies.some((company) => company.companyId === companyId)) return;

      setSelectedCompanyId(companyId);
      setSelectedSubLabelId(null);
      setSelectedArtistName(artistName ?? null);
      if (isMobile) setIsSheetOpen(true);
    },
    [allCompanies, isMobile],
  );

  const handleSearchSelect = useCallback(
    (companyId: string, artistName?: string) => handleVote(companyId, artistName),
    [handleVote],
  );

  const handleVoteSuccess = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((previous) => !previous);
  }, []);

  const topTenCopy = TOP_TEN_COPY[locale] ?? TOP_TEN_COPY.en;

  if (isLoading && allCompanies.length === 0) {
    return (
      <main className={styles.loadingContainer} data-testid="vote-board-embed-loading">
        <div className={styles.spinner} />
        <p>Loading league data...</p>
      </main>
    );
  }

  if (error && allCompanies.length === 0) {
    return (
      <main className={styles.errorContainer} data-testid="vote-board-embed-error">
        <p>Failed to load data</p>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <div ref={containerRef}>
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
        onSearchSelect={handleSearchSelect}
        onVoteSuccess={handleVoteSuccess}
        onToggleExpand={handleToggleExpand}
        onSheetClose={() => setIsSheetOpen(false)}
        voteControllerComponent={VoteController}
        bottomSheetComponent={BottomSheet}
        showKpopfaceAd={options.showAds}
        compactTopTen={options.surface === 'kpopface'}
        expandLabel={topTenCopy.expand}
        collapseLabel={topTenCopy.collapse}
        surface={options.surface}
        testId="vote-board-embed"
        layoutClassName={styles.dashboardContainer}
      />
    </div>
  );
}
