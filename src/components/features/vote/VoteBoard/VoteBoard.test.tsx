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
    renderDirectVote,
  }: {
    companies: CompanyRanking[];
    onVote?: (companyId: string) => void;
    showKpopfaceAd?: boolean;
    renderDirectVote?: (company: CompanyRanking) => ReactNode;
  }) => (
    <section data-testid="premier-league">
      {companies.map((company) => (
        <article
          key={company.companyId}
          data-testid={`ranking-card-${company.companyId}`}
          onClick={onVote ? () => onVote(company.companyId) : undefined}
        >
          <span data-testid={`ranking-label-${company.companyId}`}>
            Rank {company.nameEn}
          </span>
          {renderDirectVote?.(company)}
        </article>
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

function VoteControllerMock({
  company,
  selectedArtist,
  autoSelectedSubLabelId,
  onVoteSuccess,
  renderMode,
  voteSurfaceDescriptionId,
}: VoteControllerRenderProps) {
  if (renderMode === 'card') {
    return (
      <div
        role="button"
        tabIndex={0}
        data-testid={`direct-vote-${company?.id}`}
        aria-describedby={voteSurfaceDescriptionId}
        onClick={() => company && onVoteSuccess?.(company.id)}
      >
        <span data-testid={`card-body-${company?.id}`}>Vote {company?.name.en}</span>
      </div>
    );
  }

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
  const onVoteSuccess = vi.fn();
  const props: ComponentProps<typeof VoteBoard> = {
    premierLeague: companies,
    allCompanies: companies,
    selectedCompanyId: null,
    selectedCompany: null,
    isExpanded: false,
    isSheetOpen: false,
    isMobile: false,
    onVote,
    onVoteSuccess,
    onToggleExpand: vi.fn(),
    onSheetClose: vi.fn(),
    voteControllerComponent: VoteControllerMock,
    bottomSheetComponent: BottomSheetMock,
    showKpopfaceAd: true,
    showLeagueHeader: false,
    showSearchBar: false,
    ...overrides,
  };

  return { ...render(<VoteBoard {...props} />), onVote, onVoteSuccess };
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

    fireEvent.click(screen.getByTestId('ranking-label-company-1'));
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

  it('removes both selection panels and lets a card body click submit through the card surface', () => {
    const { onVote, onVoteSuccess } = renderBoard({
      interactionMode: 'direct',
      voteSurfaceDescriptionId: 'home-vote-helper',
    });

    expect(screen.queryByTestId('sticky-panel')).toBeNull();
    expect(screen.queryByTestId('bottom-sheet')).toBeNull();
    expect(screen.getAllByTestId(/direct-vote-company-/)).toHaveLength(4);

    const card = screen.getByTestId('ranking-card-company-1');
    expect(card.querySelectorAll('button')).toHaveLength(0);
    expect(screen.getByTestId('direct-vote-company-1').getAttribute('aria-describedby')).toBe(
      'home-vote-helper',
    );
    fireEvent.click(screen.getByTestId('card-body-company-1'));
    expect(onVote).not.toHaveBeenCalled();
    expect(onVoteSuccess).toHaveBeenCalledWith('company-1');
  });
});
