import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatHomeDdayLabel,
  formatHomeSeasonLabel,
  getHomeDirectVoteAmount,
  HomeClient,
} from './HomeClient';

const mocks = vi.hoisted(() => ({
  mockUseLeagueData: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseVote: vi.fn(),
  mockUseVoteQuota: vi.fn(),
  mockSubmitVote: vi.fn(),
  mockConsumeVote: vi.fn(),
  mockRefetchStats: vi.fn(),
  mockRefresh: vi.fn(),
  mockUseRefreshCountdown: vi.fn(),
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

vi.mock('@/hooks/useRefreshCountdown', () => ({
  useRefreshCountdown: () => mocks.mockUseRefreshCountdown(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
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
    mocks.mockUseRefreshCountdown.mockReset();

    mocks.mockUseLeagueData.mockReturnValue({
      allCompanies,
      season: { year: 2026, month: 8, daysRemaining: 15 },
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
    mocks.mockUseRefreshCountdown.mockReturnValue({
      countdown: 20,
      isRefreshing: false,
      reset: vi.fn(),
    });
    setQuota();
  });

  it('홈에는 작은 현재 시즌 라벨과 회사 카드만 남기고 검색/선택 패널을 렌더링하지 않는다', () => {
    renderHomeClient();

    const header = screen.getByRole('banner', { name: '현재 시즌' });
    const seasonLabel = screen.getByTestId('home-season-label');
    const quotaLabel = screen.getByTestId('home-today-votes');
    const refreshIndicator = screen.getByTestId('home-refresh-indicator');
    const ddayLabel = screen.getByTestId('home-season-dday');

    expect(seasonLabel.textContent).toBe('2026년 08시즌');
    expect(header.contains(seasonLabel)).toBe(true);
    expect(header.contains(quotaLabel)).toBe(true);
    expect(header.contains(refreshIndicator)).toBe(true);
    expect(header.contains(ddayLabel)).toBe(true);
    expect(screen.getByTestId('home-today-votes').textContent).toBe('오늘 100표 남음');
    expect(screen.getByTestId('home-refresh-indicator').getAttribute('data-refreshing')).toBe(
      'false',
    );
    expect(screen.getByTestId('home-refresh-icon')).toBeDefined();
    expect(screen.getByTestId('home-season-dday').textContent).toBe('D-15');
    expect(screen.getByTestId('home-company-list')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).toBeNull();
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
    let resolveRefresh: (() => void) | undefined;
    mocks.mockRefresh.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
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
          effects: true,
          userId: null,
        }),
      );
    });
    expect(screen.getByTestId('vote-feedback-company-jyp').getAttribute('style')).toContain(
      'width: 100%',
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByTestId('vote-score-company-jyp').textContent).toBe('+100');
    expect(screen.queryByText(/투표 중/)).toBeNull();

    resolveVote?.({
      success: true,
      voteScore: 100,
      remaining: 0,
      message: 'Vote submitted',
    });

    await waitFor(() => {
      expect(screen.getByTestId('vote-feedback-company-jyp').getAttribute('style')).toContain(
        'width: 100%',
      );
      expect(screen.getByRole('button', { name: /JYP/ }).getAttribute('data-status')).toBe('success');
      expect(screen.getByTestId('vote-score-company-jyp').textContent).toBe('+100');
      expect(screen.queryByText(/표 반영/)).toBeNull();
    });
    expect(mocks.mockConsumeVote).toHaveBeenCalledWith(100);
    expect(mocks.mockRefresh).toHaveBeenCalled();
    resolveRefresh?.();
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
      expect(screen.getByTestId('vote-feedback-company-sm').getAttribute('style')).toContain(
        'width: 37%',
      );
    });
    expect(mocks.mockConsumeVote).toHaveBeenCalledWith(37);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByTestId('vote-score-company-sm').textContent).toBe('+37');
    expect(screen.queryByText(/표 반영/)).toBeNull();
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
      expect(screen.getByRole('button', { name: /JYP/ }).getAttribute('data-status')).toBe('error');
      expect(screen.queryByTestId('vote-score-company-jyp')).toBeNull();
    });
    expect(screen.queryByText(/투표에 실패했어요/)).toBeNull();
    expect((screen.getByRole('button', { name: /JYP/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.mockConsumeVote).not.toHaveBeenCalled();
    expect(mocks.mockRefresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('submit adapter rejection shows an error and releases the card', async () => {
    mocks.mockSubmitVote.mockRejectedValue(new Error('network unavailable'));

    renderHomeClient();
    fireEvent.click(screen.getByRole('button', { name: /JYP/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /JYP/ }).getAttribute('data-status')).toBe('error');
      expect(screen.queryByTestId('vote-score-company-jyp')).toBeNull();
    });

    expect(screen.queryByText(/투표에 실패했어요/)).toBeNull();
    expect((screen.getByRole('button', { name: /JYP/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(mocks.mockRefresh).not.toHaveBeenCalled();
  });

  it('상단 refresh 상태가 갱신 중이면 회전 스피너와 상태 문구를 표시한다', () => {
    mocks.mockUseRefreshCountdown.mockReturnValue({
      countdown: 20,
      isRefreshing: true,
      reset: vi.fn(),
    });

    renderHomeClient();

    expect(screen.getByTestId('home-refresh-indicator').getAttribute('data-refreshing')).toBe(
      'true',
    );
    expect(screen.getByTestId('home-refresh-spinner')).toBeDefined();
    expect(screen.getByText('갱신 중…')).toBeDefined();
    expect(screen.queryByTestId('home-refresh-icon')).toBeNull();
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

describe('formatHomeSeasonLabel', () => {
  it('월을 항상 두 자리로 표시해 다음 시즌에도 같은 형식을 유지한다', () => {
    expect(formatHomeSeasonLabel(2026, 8)).toBe('2026년 08시즌');
    expect(formatHomeSeasonLabel(2027, 1)).toBe('2027년 01시즌');
  });
});

describe('formatHomeDdayLabel', () => {
  it('음수와 소수 일수를 안전하게 D-day 형식으로 보정한다', () => {
    expect(formatHomeDdayLabel(15)).toBe('D-15');
    expect(formatHomeDdayLabel(0)).toBe('D-0');
    expect(formatHomeDdayLabel(-1)).toBe('D-0');
    expect(formatHomeDdayLabel(1.9)).toBe('D-1');
  });
});
