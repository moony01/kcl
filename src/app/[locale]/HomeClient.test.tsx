import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHomeDirectVoteAmount, HomeClient } from './HomeClient';

const mocks = vi.hoisted(() => ({
  mockUseLeagueData: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseVote: vi.fn(),
  mockUseVoteQuota: vi.fn(),
  mockSubmitVote: vi.fn(),
  mockConsumeVote: vi.fn(),
  mockRefetchStats: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock('@/hooks/useLeagueData', () => ({
  useLeagueData: () => mocks.mockUseLeagueData(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mocks.mockUseAuth(),
}));

vi.mock('@/hooks/useVote', () => ({
  useVote: () => mocks.mockUseVote(),
}));

vi.mock('@/hooks/useVoteQuota', () => ({
  useVoteQuota: (...args: unknown[]) => mocks.mockUseVoteQuota(...args),
}));

const allCompanies = [
  {
    companyId: 'company-jyp',
    companyName: 'JYP',
    nameEn: 'JYP',
    nameKo: 'JYP',
    artists: { en: ['RESCENE'], ko: ['리센느'] },
    voteCount: 690,
    voteCountHourly: 0,
    rank: 1,
    previousRank: 1,
    rankChange: 0,
    gradientColor: '#111111',
    logoUrl: '',
    tier: 'premier' as const,
    isRelegationZone: false,
    isPromotionZone: false,
    promotionStatus: 'safe' as const,
  },
  {
    companyId: 'company-sm',
    companyName: 'SM',
    nameEn: 'SM',
    nameKo: 'SM',
    artists: { en: ['aespa'], ko: ['에스파'] },
    voteCount: 387,
    voteCountHourly: 0,
    rank: 2,
    previousRank: 2,
    rankChange: 0,
    gradientColor: '#8B5CF6',
    logoUrl: '',
    tier: 'premier' as const,
    isRelegationZone: false,
    isPromotionZone: false,
    promotionStatus: 'safe' as const,
  },
];

const defaultQuota = {
  used: 0,
  remaining: 100,
  max: 100,
  canVote: true,
  timeUntilReset: '10시간 20분',
  hoursUntilReset: 10,
  minutesUntilReset: 20,
  mode: 'daily' as const,
};

function renderHomeClient() {
  return render(<HomeClient />);
}

function setQuota(overrides: Partial<typeof defaultQuota> = {}) {
  mocks.mockUseVoteQuota.mockReturnValue({
    quota: { ...defaultQuota, ...overrides },
    useVote: mocks.mockConsumeVote,
    refetchStats: mocks.mockRefetchStats,
    isLoading: false,
  });
}

describe('HomeClient simple company voting surface', () => {
  beforeEach(() => {
    vi.useRealTimers();
    mocks.mockUseLeagueData.mockReset();
    mocks.mockUseAuth.mockReset();
    mocks.mockUseVote.mockReset();
    mocks.mockUseVoteQuota.mockReset();
    mocks.mockSubmitVote.mockReset();
    mocks.mockConsumeVote.mockReset();
    mocks.mockRefetchStats.mockReset();
    mocks.mockRefresh.mockReset();

    mocks.mockUseLeagueData.mockReturnValue({
      allCompanies,
      isLoading: false,
      error: null,
      refresh: mocks.mockRefresh,
    });
    mocks.mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    });
    mocks.mockSubmitVote.mockResolvedValue({
      success: true,
      voteScore: 100,
      remaining: 0,
      message: 'Vote submitted',
    });
    mocks.mockUseVote.mockReturnValue({
      submitVote: mocks.mockSubmitVote,
      isLoading: false,
    });
    mocks.mockConsumeVote.mockReturnValue(true);
    mocks.mockRefetchStats.mockResolvedValue(undefined);
    mocks.mockRefresh.mockResolvedValue(undefined);
    setQuota();
  });

  it('홈 렌더 트리에는 회사 카드만 남기고 검색/시즌/선택 패널을 렌더링하지 않는다', () => {
    renderHomeClient();

    expect(screen.getByTestId('home-company-list')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/시즌/)).toBeNull();
    expect(screen.queryByText('Battle Station')).toBeNull();
    expect(screen.queryByTestId('bottom-sheet')).toBeNull();
    expect(screen.queryByTestId('sticky-panel')).toBeNull();
  });

  it('카드 클릭은 선택 단계를 건너뛰고 100표 직접투표를 시작한다', async () => {
    let resolveVote: ((value: {
      success: boolean;
      voteScore: number;
      remaining: number;
      message: string;
    }) => void) | undefined;
    mocks.mockSubmitVote.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveVote = resolve;
        }),
    );

    renderHomeClient();
    fireEvent.click(screen.getByRole('button', { name: /JYP/ }));

    await waitFor(() => {
      expect(mocks.mockSubmitVote).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-jyp',
          votePower: 100,
          voteSource: 'web',
          effects: false,
          userId: null,
        }),
      );
    });
    expect(screen.getByTestId('vote-gauge-company-jyp').getAttribute('data-gauge-mode')).toBe(
      'single-vote-feedback',
    );
    expect(screen.getByTestId('vote-gauge-company-jyp').getAttribute('aria-valuenow')).toBe(
      '100',
    );
    expect(screen.getByText('100표 투표 중…')).toBeDefined();

    resolveVote?.({
      success: true,
      voteScore: 100,
      remaining: 0,
      message: 'Vote submitted',
    });

    await waitFor(() => {
      expect(screen.getByText('+100표 반영 · 오늘 0표 남음')).toBeDefined();
    });
    expect(mocks.mockConsumeVote).toHaveBeenCalledWith(100);
    expect(mocks.mockRefresh).toHaveBeenCalled();
  });

  it('남은 quota가 100보다 적으면 잔여량만 서버에 전달한다', async () => {
    setQuota({ used: 63, remaining: 37, max: 100 });
    mocks.mockSubmitVote.mockResolvedValue({
      success: true,
      voteScore: 37,
      remaining: 0,
      message: 'Vote submitted',
    });

    renderHomeClient();
    fireEvent.click(screen.getByRole('button', { name: /SM/ }));

    await waitFor(() => {
      expect(mocks.mockSubmitVote).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 'company-sm',
          votePower: 37,
        }),
      );
      expect(screen.getByTestId('vote-gauge-company-sm').getAttribute('aria-valuenow')).toBe(
        '37',
      );
    });
    expect(mocks.mockConsumeVote).toHaveBeenCalledWith(37);
    expect(screen.getByText('+37표 반영 · 오늘 0표 남음')).toBeDefined();
  });

  it('투표 실패를 카드 안에 표시하고 성공 refresh를 실행하지 않는다', async () => {
    mocks.mockSubmitVote.mockResolvedValue({
      success: false,
      errorCode: 'SUPABASE_ERROR',
      message: 'Failed to submit vote',
    });

    renderHomeClient();
    fireEvent.click(screen.getByRole('button', { name: /JYP/ }));

    await waitFor(() => {
      expect(screen.getByText('투표에 실패했어요. 다시 눌러 주세요.')).toBeDefined();
    });
    expect(mocks.mockConsumeVote).not.toHaveBeenCalled();
    expect(mocks.mockRefresh).not.toHaveBeenCalled();
    expect(screen.getByTestId('vote-gauge-company-jyp').getAttribute('aria-valuenow')).toBe(
      '0',
    );
  });
});

describe('getHomeDirectVoteAmount', () => {
  it('100표를 기본 단위로 사용하고 잔여량만큼 안전하게 보정한다', () => {
    expect(getHomeDirectVoteAmount(300)).toBe(100);
    expect(getHomeDirectVoteAmount(100)).toBe(100);
    expect(getHomeDirectVoteAmount(37)).toBe(37);
    expect(getHomeDirectVoteAmount(0)).toBe(0);
    expect(getHomeDirectVoteAmount(-5)).toBe(0);
  });
});
