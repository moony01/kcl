import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VoteBoardEmbedClient, { parseVoteBoardEmbedOptions } from './VoteBoardEmbedClient';

vi.mock('@/hooks/useLeagueData', () => ({
  useLeagueData: () => ({
    premierLeague: [],
    allCompanies: [],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/features/vote/VoteBoard', () => ({
  default: ({
    testId,
    surface,
    showKpopfaceAd,
  }: {
    testId?: string;
    surface?: string;
    showKpopfaceAd?: boolean;
  }) => (
    <section
      data-testid={testId}
      data-surface={surface}
      data-ads={showKpopfaceAd ? 'on' : 'off'}
    >
      <ol>
        <li data-rank="3">Rank 3</li>
        <li data-rank="4">Rank 4</li>
      </ol>
      <button type="button">Show top 10</button>
    </section>
  ),
}));

vi.mock('@/components/features/VoteController', () => ({ default: () => null }));
vi.mock('@/components/ui/BottomSheet', () => ({ default: () => null }));

beforeEach(() => {
  window.history.replaceState({}, '', '/embed/vote-board/ko');
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('parseVoteBoardEmbedOptions', () => {
  it('allows an explicit kpopface surface with ads enabled', () => {
    expect(parseVoteBoardEmbedOptions('?surface=kpopface&ads=on')).toEqual({
      surface: 'kpopface',
      showAds: true,
    });
  });

  it('defaults to a partner surface with ads disabled', () => {
    expect(parseVoteBoardEmbedOptions('')).toEqual({
      surface: 'partner',
      showAds: false,
    });
  });

  it('does not trust unsupported surface or ad values', () => {
    expect(parseVoteBoardEmbedOptions('?surface=javascript:alert(1)&ads=yes')).toEqual({
      surface: 'partner',
      showAds: false,
    });
  });
});

describe('VoteBoardEmbedClient Kpopface signup CTA', () => {
  it.each([
    ['ko', 'KCL 가입하고 매일 300표 받기'],
    ['en', 'Join KCL for 300 votes every day'],
    ['ja', 'KCLに登録して毎日300票を使う'],
    ['zh', '注册 KCL，每天获得 300 票'],
    ['es', 'Regístrate en KCL y consigue 300 votos diarios'],
    ['fr', 'Inscris-toi sur KCL pour 300 votes par jour'],
    ['de', 'Bei KCL registrieren und täglich 300 Stimmen erhalten'],
  ])('renders the localized %s CTA after the compact board', async (locale, label) => {
    window.history.replaceState(
      {},
      '',
      `/embed/vote-board/${locale}?surface=kpopface&ads=off`,
    );

    render(<VoteBoardEmbedClient locale={locale} />);

    const cta = await screen.findByRole('link', { name: label });
    const board = screen.getByTestId('vote-board-embed');

    expect(cta.getAttribute('href')).toBe(`/${locale}/signup`);
    expect(cta.getAttribute('target')).toBe('_blank');
    expect(cta.getAttribute('rel')).toBe('noopener noreferrer');
    expect(board.getAttribute('data-ads')).toBe('off');
    expect(board.contains(cta)).toBe(false);
    expect(board.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  });

  it.each(['partner', 'kcl-modal'])('does not render the CTA on the %s surface', async (surface) => {
    window.history.replaceState(
      {},
      '',
      `/embed/vote-board/en?surface=${surface}&ads=off`,
    );

    render(<VoteBoardEmbedClient locale="en" />);

    await waitFor(() => {
      expect(screen.getByTestId('vote-board-embed').getAttribute('data-surface')).toBe(surface);
    });
    expect(
      screen.queryByRole('link', { name: 'Join KCL for 300 votes every day' }),
    ).toBeNull();
  });
});
