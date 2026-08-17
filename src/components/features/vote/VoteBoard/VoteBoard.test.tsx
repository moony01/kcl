import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps, ReactNode } from 'react';
import type { CompanyType } from '@/lib/mock-data';
import type { CompanyRanking } from '@/types/league';
import VoteBoard, { type BottomSheetRenderProps, type VoteControllerRenderProps } from './index';

vi.mock('framer-motion', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) =>
        React.forwardRef<HTMLElement, Record<string, unknown>>(function MotionMock(
          { children, initial, animate, exit, transition, layout, whileTap, whileHover, ...props },
          ref,
        ) {
          void initial;
          void animate;
          void exit;
          void transition;
          void layout;
          void whileTap;
          void whileHover;
          return React.createElement(tag, { ...props, ref }, children as React.ReactNode);
        }),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    motion,
  };
});

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/features/league/LeagueHeader', () => ({
  LeagueHeader: () => <div data-testid="legacy-league-header" />,
}));

vi.mock('@/components/ui/SearchBar', () => ({
  default: () => <input aria-label="legacy search" />,
}));

vi.mock('@/components/ui/StickyPanel', () => ({
  default: ({ children }: { children: ReactNode }) => (
    <aside data-testid="sticky-panel">{children}</aside>
  ),
}));

vi.mock('@/components/features/league/PremierLeague', () => ({
  default: ({
    companies,
    onVote,
    showKpopfaceAd,
  }: {
    companies: CompanyRanking[];
    onVote: (companyId: string) => void;
    showKpopfaceAd?: boolean;
  }) => (
    <section data-testid="premier-league">
      {companies.map((company) => (
        <button key={company.companyId} type="button" onClick={() => onVote(company.companyId)}>
          Rank {company.nameEn}
        </button>
      ))}
      {showKpopfaceAd && <div data-testid="kpopface-ad-slot" />}
    </section>
  ),
}));

vi.mock('@/components/features/league/LeagueRankingItem', () => ({
  default: () => <div data-testid="league-ranking-item" />,
}));

const companies: CompanyRanking[] = [1, 2, 3, 4].map((rank) => ({
  companyId: `company-${rank}`,
  companyName: `Company ${rank}`,
  nameKo: `회사 ${rank}`,
  nameEn: `Company ${rank}`,
  logoUrl: '',
  gradientColor: '#8B5CF6',
  rank,
  previousRank: rank,
  rankChange: 0,
  voteCount: 1000 - rank,
  voteCountHourly: 0,
  tier: 'premier',
  isRelegationZone: false,
  isPromotionZone: false,
  promotionStatus: 'safe',
  artists: { en: ['Artist'], ko: ['아티스트'] },
}));

const selectedCompany: CompanyType = {
  id: 'company-1',
  name: { en: 'Company 1', ko: '회사 1' },
  representative: { en: ['Artist'], ko: ['아티스트'] },
  firepower: 999,
  rank: 1,
  change: 'same',
  image: '#8B5CF6',
  stockHistory: [],
};

function VoteControllerMock({ company, selectedArtist, autoSelectedSubLabelId }: VoteControllerRenderProps) {
  return (
    <div data-testid="vote-controller">
      {company?.name.en ?? 'none'}
      {selectedArtist ? ` / ${selectedArtist}` : ''}
      {autoSelectedSubLabelId ? ` / ${autoSelectedSubLabelId}` : ''}
    </div>
  );
}

function BottomSheetMock({ isOpen, children }: BottomSheetRenderProps) {
  return isOpen ? <div data-testid="bottom-sheet">{children}</div> : null;
}

function renderBoard(overrides: Partial<ComponentProps<typeof VoteBoard>> = {}) {
  const onVote = vi.fn();
  const props: ComponentProps<typeof VoteBoard> = {
    premierLeague: companies,
    allCompanies: companies,
    selectedCompanyId: null,
    selectedCompany: null,
    isExpanded: false,
    isSheetOpen: false,
    isMobile: false,
    onVote,
    onVoteSuccess: vi.fn(),
    onToggleExpand: vi.fn(),
    onSheetClose: vi.fn(),
    voteControllerComponent: VoteControllerMock,
    bottomSheetComponent: BottomSheetMock,
    showKpopfaceAd: true,
    showLeagueHeader: false,
    showSearchBar: false,
    ...overrides,
  };

  return { ...render(<VoteBoard {...props} />), onVote };
}

describe('legacy VoteBoard selection surface', () => {
  it('keeps the legacy ranking structure and KPOPFACE slot without home search', () => {
    renderBoard();

    expect(screen.getByTestId('premier-league')).toBeDefined();
    expect(screen.getByTestId('kpopface-ad-slot')).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByTestId('legacy-league-header')).toBeNull();
  });

  it('selects a ranking card and displays the selected company in desktop StickyPanel', () => {
    const { onVote, rerender } = renderBoard();

    fireEvent.click(screen.getByRole('button', { name: 'Rank Company 1' }));
    expect(onVote).toHaveBeenCalledWith('company-1');

    rerender(
      <VoteBoard
        premierLeague={companies}
        allCompanies={companies}
        selectedCompanyId="company-1"
        selectedCompany={selectedCompany}
        isExpanded={false}
        isSheetOpen={false}
        isMobile={false}
        onVote={onVote}
        onVoteSuccess={vi.fn()}
        onToggleExpand={vi.fn()}
        onSheetClose={vi.fn()}
        voteControllerComponent={VoteControllerMock}
        bottomSheetComponent={BottomSheetMock}
        showLeagueHeader={false}
        showSearchBar={false}
      />,
    );

    expect(screen.getByTestId('sticky-panel').textContent).toContain('Company 1');
    expect(screen.queryByTestId('bottom-sheet')).toBeNull();
  });

  it('displays the same VoteController in the mobile BottomSheet with selection context', () => {
    renderBoard({
      selectedCompanyId: 'company-1',
      selectedCompany,
      selectedArtistName: 'Artist',
      selectedSubLabelId: 'label-1',
      isMobile: true,
      isSheetOpen: true,
    });

    expect(screen.getByTestId('bottom-sheet').textContent).toContain(
      'Company 1 / Artist / label-1',
    );
  });
});
