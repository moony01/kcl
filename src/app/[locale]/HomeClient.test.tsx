import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeClient } from './HomeClient';

const mocks = vi.hoisted(() => ({
  mockUseLeagueData: vi.fn(),
  mockUseAuth: vi.fn(),
  mockFrom: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
}));

vi.mock('next/dynamic', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  return {
    default: (loader: () => Promise<unknown>) => {
      const source = loader.toString();

      if (source.includes('BottomSheet')) {
        return function MockBottomSheet({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
          return isOpen ? React.createElement('div', { 'data-testid': 'bottom-sheet' }, children) : null;
        };
      }

      if (source.includes('VoteController')) {
        return function MockVoteController({
          company,
          selectedArtist,
          autoSelectedSubLabelId,
          onGuestQuotaExhausted,
        }: {
          company: { name: { en: string } } | null;
          selectedArtist?: string;
          autoSelectedSubLabelId?: string | null;
          onGuestQuotaExhausted?: () => void;
        }) {
          return React.createElement(
            'section',
            { 'data-testid': 'vote-controller' },
            React.createElement('p', null, `Selected Company: ${company?.name.en ?? 'none'}`),
            selectedArtist ? React.createElement('p', null, `For ${selectedArtist}`) : null,
            autoSelectedSubLabelId
              ? React.createElement('p', null, `SubLabel ${autoSelectedSubLabelId}`)
              : null,
            React.createElement(
              'button',
              { type: 'button', onClick: onGuestQuotaExhausted },
              'Guest quota exhausted',
            ),
          );
        };
      }

      return function MockDynamicFallback() {
        return null;
      };
    },
  };
});

vi.mock('@/hooks/useLeagueData', () => ({
  useLeagueData: () => mocks.mockUseLeagueData(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mocks.mockUseAuth(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ from: mocks.mockFrom }),
}));

vi.mock('@/components/ui/StickyPanel', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'sticky-panel' }, children),
  };
});

vi.mock('@/components/ui/SearchBar', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: ({ onSelect }: { onSelect: (companyId: string, artistName?: string) => void }) =>
      React.createElement(
        'div',
        null,
        React.createElement(
          'button',
          { type: 'button', onClick: () => onSelect('company-sm') },
          'Search SM company',
        ),
        React.createElement(
          'button',
          { type: 'button', onClick: () => onSelect('company-sm', 'aespa') },
          'Search aespa artist',
        ),
      ),
  };
});

vi.mock('@/components/features/league/PremierLeague', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: ({
      companies,
      onVote,
    }: {
      companies: Array<{ companyId: string; nameEn: string }>;
      onVote: (companyId: string) => void;
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'premier-league' },
        companies.map((company) =>
          React.createElement(
            'button',
            {
              key: company.companyId,
              type: 'button',
              onClick: () => onVote(company.companyId),
            },
            `Rank ${company.nameEn}`,
          ),
        ),
      ),
  };
});

vi.mock('@/components/features/league/LeagueRankingItem', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: ({
      company,
      onVote,
    }: {
      company: { companyId: string; nameEn: string };
      onVote: (companyId: string) => void;
    }) =>
      React.createElement(
        'button',
        { type: 'button', onClick: () => onVote(company.companyId) },
        `Rank ${company.nameEn}`,
      ),
  };
});

vi.mock('@/components/features/league/LeagueHeader', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    LeagueHeader: () => React.createElement('div', { 'data-testid': 'league-header' }),
  };
});

vi.mock('@/components/features/home/HomeComments', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: () => React.createElement('div', { 'data-testid': 'home-comments' }),
  };
});

vi.mock('@/components/common/AdBanner', () => ({
  default: () => null,
}));

vi.mock('@/components/common/Modal', async () => {
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    default: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) =>
      isOpen ? React.createElement('div', { 'data-testid': 'modal' }, children) : null,
  };
});

const allCompanies = [
  {
    companyId: 'company-jyp',
    nameEn: 'JYP',
    nameKo: 'JYP',
    artists: { en: ['RESCENE'], ko: ['리센느'] },
    voteCount: 690,
    rank: 1,
    rankChange: 0,
    gradientColor: '#111111',
    logoUrl: '',
  },
  {
    companyId: 'company-sm',
    nameEn: 'SM',
    nameKo: 'SM',
    artists: { en: ['aespa'], ko: ['에스파'] },
    voteCount: 387,
    rank: 2,
    rankChange: 0,
    gradientColor: '#8B5CF6',
    logoUrl: '',
  },
];

function mockFavoriteGroupQuery() {
  const single = vi.fn().mockResolvedValue({
    data: { company_id: 'company-jyp', name_en: 'RESCENE' },
    error: null,
  });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, single };
}

function renderHomeClient() {
  return render(<HomeClient />);
}

describe('HomeClient vote context', () => {
  beforeEach(() => {
    mocks.mockUseLeagueData.mockReset();
    mocks.mockUseAuth.mockReset();
    mocks.mockFrom.mockReset();
    mocks.mockRefresh.mockReset();
    window.history.replaceState({}, '', '/ko');
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1024,
    });

    mocks.mockUseLeagueData.mockReturnValue({
      premierLeague: allCompanies,
      allCompanies,
      isLoading: false,
      error: null,
      refresh: mocks.mockRefresh,
    });
    mocks.mockUseAuth.mockReturnValue({
      profile: { favorite_group_id: 'group-rescene' },
      isLoading: false,
      isAuthenticated: true,
    });
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'kcl_groups') return mockFavoriteGroupQuery();
      throw new Error(`unexpected table: ${table}`);
    });
  });

  it('수동으로 다른 회사를 선택하면 이전 최애 그룹 For 문구를 지운다', async () => {
    renderHomeClient();

    await waitFor(() => {
      expect(screen.getByText('For RESCENE')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Rank SM' }));

    await waitFor(() => {
      expect(screen.queryByText('For RESCENE')).toBeNull();
      expect(screen.getByText('Selected Company: SM')).toBeDefined();
    });
  });

  it('아티스트 검색 결과를 선택하면 선택한 아티스트 For 문구를 표시한다', async () => {
    renderHomeClient();

    fireEvent.click(screen.getByRole('button', { name: 'Search aespa artist' }));

    await waitFor(() => {
      expect(screen.getByText('For aespa')).toBeDefined();
      expect(screen.queryByText('For RESCENE')).toBeNull();
    });
  });

  it('비로그인 홈 진입만으로는 투표권 안내 모달을 열지 않는다', () => {
    mocks.mockUseAuth.mockReturnValue({
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });

    renderHomeClient();

    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('비로그인 사용자가 투표권을 모두 쓴 뒤 투표를 시도하면 안내 모달을 연다', async () => {
    mocks.mockUseAuth.mockReturnValue({
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });

    renderHomeClient();

    fireEvent.click(screen.getByRole('button', { name: 'Rank JYP' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Guest quota exhausted' })[0]);

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeDefined();
      expect(screen.getByText('비로그인 100표 / 로그인 300표 (매일)')).toBeDefined();
    });
  });

  it('Vote Dock 딥링크로 진입하면 해당 회사를 선택하고 모바일 투표창을 연다', async () => {
    mocks.mockUseAuth.mockReturnValue({
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 390,
    });
    window.history.replaceState({}, '', '/ko?voteCompany=sm#vote-station');

    renderHomeClient();

    await waitFor(() => {
      const bottomSheet = screen.getByTestId('bottom-sheet');
      expect(bottomSheet.textContent).toContain('Selected Company: SM');
    });
  });
});
