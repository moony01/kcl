import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CompanyRanking } from '@/types/league';
import EmbedVoteClient from './EmbedVoteClient';

const hookMocks = vi.hoisted(() => ({
  consumeVote: vi.fn(),
  refresh: vi.fn(),
  refetchStats: vi.fn(),
}));

const companies: CompanyRanking[] = Array.from({ length: 12 }, (_, index) => ({
  companyId: `company-${index + 1}`,
  companyName: `Company ${index + 1}`,
  nameKo: `회사 ${index + 1}`,
  nameEn: `Company ${index + 1}`,
  logoUrl: '',
  gradientColor: '#7c3aed',
  rank: index + 1,
  previousRank: index + 1,
  rankChange: 0,
  voteCount: 1000 - index,
  voteCountHourly: 0,
  tier: index < 10 ? 'premier' : 'challengers',
  isRelegationZone: false,
  isPromotionZone: false,
  promotionStatus: 'safe',
  artists: { en: [], ko: [] },
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));
vi.mock('@/hooks/useLeagueData', () => ({
  useLeagueData: () => ({
    allCompanies: companies,
    isLoading: false,
    refresh: hookMocks.refresh,
  }),
}));
vi.mock('@/hooks/useVoteQuota', () => ({
  useVoteQuota: () => ({
    quota: { remaining: 30, canVote: true },
    useVote: hookMocks.consumeVote,
    isLoading: false,
    refetchStats: hookMocks.refetchStats,
  }),
}));
vi.mock('@/lib/api', () => ({
  getKpopfaceEmbedVoteStatus: vi.fn().mockResolvedValue(null),
  KPOPFACE_EMBED_POWER_MAX: 30,
  submitVote: vi.fn(),
}));
vi.mock('@/lib/company-logos', () => ({
  getCompanyLogoBackground: () => '#7c3aed',
  getCompanyLogoUrl: () => null,
}));

describe('EmbedVoteClient surface', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/embed/kpopface-vote/ko');
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        disconnect() {}
      },
    );
  });

  it('기본 Kpopface 임베드는 기존 TOP 4와 확장 CTA를 유지한다', () => {
    render(<EmbedVoteClient locale="ko" />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('link', { name: '100표 더 투표하기' })).toBeDefined();
    expect(screen.getByRole('button', { name: '10위까지 보기' })).toBeDefined();
  });

  it('KCL 모달 surface는 TOP 10을 자동 표시하고 중복 CTA를 숨긴다', async () => {
    window.history.replaceState({}, '', '/embed/kpopface-vote/ko?surface=kcl-modal');
    render(<EmbedVoteClient locale="ko" />);

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(10);
    });
    expect(screen.queryByRole('link', { name: '100표 더 투표하기' })).toBeNull();
    expect(screen.queryByRole('button', { name: '접기' })).toBeNull();
  });
});
