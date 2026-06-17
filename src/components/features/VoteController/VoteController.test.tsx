import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoteController from './index';
import type { CompanyType } from '@/lib/mock-data';

const mocks = vi.hoisted(() => ({
  mockSubmitVote: vi.fn(),
  mockConsumeVote: vi.fn(),
  mockOnVoteSuccess: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string, values?: { defaultValue?: string }) => {
    const translations: Record<string, string> = {
      select_artist: 'Select artist',
      who_fan: 'Who are you a fan of?',
      sub_label_title: 'Sub-label',
      sub_label_all: 'All labels',
      'button.vote': 'Vote',
      'button.exhausted': 'No votes left',
    };
    return values?.defaultValue ?? translations[key] ?? key;
  },
}));

vi.mock('framer-motion', async () => {
  const React = await vi.importActual<typeof import('react')>('react');

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        return React.forwardRef<HTMLElement, Record<string, unknown>>(function MotionMock(
          { children, whileHover, initial, animate, exit, transition, ...props },
          ref,
        ) {
          void whileHover;
          void initial;
          void animate;
          void exit;
          void transition;
          return React.createElement(tag, { ...props, ref }, children as React.ReactNode);
        });
      },
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    motion,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    profile: { is_pro: false },
  }),
}));

vi.mock('@/hooks/useVote', () => ({
  useVote: () => ({
    submitVote: mocks.mockSubmitVote,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useVoteQuota', () => ({
  useVoteQuota: () => ({
    quota: {
      canVote: true,
      remaining: 100,
      max: 100,
      used: 0,
      hoursUntilReset: 12,
      minutesUntilReset: 0,
      mode: 'guest',
    },
    useVote: mocks.mockConsumeVote,
    isLoading: false,
  }),
}));

vi.mock('@/components/features/vote/VoteQuotaBar', () => ({
  default: () => <div data-testid="vote-quota-bar" />,
}));

const smCompany: CompanyType = {
  id: 'company-sm',
  name: { en: 'SM', ko: 'SM' },
  representative: { en: ['aespa', 'RIIZE'], ko: ['에스파', '라이즈'] },
  firepower: 387,
  rank: 2,
  change: 'same',
  image: 'linear-gradient(135deg, #8B5CF6 0%, #1A1A1A 100%)',
  stockHistory: [],
};

function forArtistText(artist: string) {
  return (_content: string, element: Element | null) =>
    element?.tagName.toLowerCase() === 'p' && element.textContent === `For ${artist}`;
}

describe('VoteController artist selection persistence', () => {
  beforeEach(() => {
    mocks.mockSubmitVote.mockReset();
    mocks.mockSubmitVote.mockResolvedValue({ success: true, voteScore: 1 });
    mocks.mockConsumeVote.mockReset();
    mocks.mockOnVoteSuccess.mockReset();
  });

  it('투표 성공 후 같은 회사 데이터가 새로고침되어도 사용자가 선택한 아티스트를 유지한다', async () => {
    const { rerender } = render(
      <VoteController company={smCompany} onVoteSuccess={mocks.mockOnVoteSuccess} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Select artist' }));
    fireEvent.click(screen.getByRole('option', { name: 'aespa' }));

    expect(screen.getByText(forArtistText('aespa'))).toBeDefined();

    // 투표 성공 후 HomeClient.refresh()가 실행되면 같은 회사가 새 객체로 파생된다.
    // 이때 사용자가 직접 고른 아티스트 선택은 유지되어야 한다.
    rerender(
      <VoteController
        company={{ ...smCompany, firepower: smCompany.firepower + 1 }}
        onVoteSuccess={mocks.mockOnVoteSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(forArtistText('aespa'))).toBeDefined();
    });
  });

  it('부모 선택 컨텍스트가 같은 회사에서 해제되면 For 문구를 지운다', async () => {
    const { rerender } = render(
      <VoteController
        company={smCompany}
        selectedArtist="aespa"
        onVoteSuccess={mocks.mockOnVoteSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(forArtistText('aespa'))).toBeDefined();
    });

    rerender(<VoteController company={smCompany} onVoteSuccess={mocks.mockOnVoteSuccess} />);

    await waitFor(() => {
      expect(screen.queryByText(forArtistText('aespa'))).toBeNull();
      expect(screen.getByRole('button', { name: 'Select artist' })).toBeDefined();
    });
  });
});
