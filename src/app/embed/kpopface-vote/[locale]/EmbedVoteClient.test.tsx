import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EmbedVoteClient from './EmbedVoteClient';

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
  default: ({ surface, votePolicy }: { surface?: string; votePolicy?: { id?: string } }) => (
    <section data-testid="canonical-vote-board" data-surface={surface} data-policy={votePolicy?.id} />
  ),
}));

vi.mock('@/components/features/VoteController', () => ({ default: () => null }));
vi.mock('@/components/ui/BottomSheet', () => ({ default: () => null }));

beforeEach(() => {
  window.history.replaceState({}, '', '/embed/kpopface-vote/ko');
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

describe('legacy Kpopface embed compatibility', () => {
  it('renders the canonical VoteBoard with the Kpopface surface and policy', () => {
    render(<EmbedVoteClient locale="ko" />);

    const board = screen.getByTestId('canonical-vote-board');
    expect(board.getAttribute('data-surface')).toBe('kpopface');
    expect(board.getAttribute('data-policy')).toBe('kpopface-embed');
  });

  it('preserves an explicit legacy surface query for compatibility callers', () => {
    window.history.replaceState({}, '', '/embed/kpopface-vote/ko?surface=kcl-modal');
    render(<EmbedVoteClient locale="ko" />);

    const board = screen.getByTestId('canonical-vote-board');
    expect(board.getAttribute('data-surface')).toBe('kcl-modal');
    expect(board.getAttribute('data-policy')).toBe('web');
  });
});
