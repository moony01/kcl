import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVote } from './useVote';

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  submitVoteApi: vi.fn(),
  confetti: vi.fn(),
  vibrate: vi.fn(),
}));

vi.mock('swr', () => ({
  useSWRConfig: () => ({ mutate: mocks.mutate }),
}));

vi.mock('@/lib/api', () => ({
  submitVote: mocks.submitVoteApi,
}));

vi.mock('canvas-confetti', () => ({
  default: mocks.confetti,
}));

describe('useVote submit result boundary', () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.submitVoteApi.mockReset();
    mocks.confetti.mockReset();
    mocks.vibrate.mockReset();
    vi.stubGlobal('navigator', { vibrate: mocks.vibrate });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the server success result when SWR revalidation fails', async () => {
    mocks.submitVoteApi.mockResolvedValue({
      success: true,
      voteScore: 100,
      remaining: 0,
      message: 'Vote submitted',
    });
    mocks.mutate.mockRejectedValue(new Error('companies revalidation failed'));

    const { result } = renderHook(() => useVote());
    let response: Awaited<ReturnType<typeof result.current.submitVote>> = null;

    await act(async () => {
      response = await result.current.submitVote({
        companyId: 'company-jyp',
        votePower: 100,
        effects: false,
      });
    });

    expect(response).toMatchObject({ success: true, voteScore: 100 });
    expect(result.current.isLoading).toBe(false);
    expect(mocks.submitVoteApi).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-jyp', votePower: 100 }),
    );
    expect(mocks.mutate).toHaveBeenCalledWith('companies');
  });

  it('runs the legacy game effect only after a successful server result', async () => {
    mocks.submitVoteApi.mockResolvedValue({
      success: true,
      voteScore: 1,
      remaining: 99,
      message: 'Vote submitted',
    });
    mocks.mutate.mockResolvedValue(undefined);

    const { result } = renderHook(() => useVote());

    await act(async () => {
      await result.current.submitVote({
        companyId: 'company-jyp',
        companyColor: '#111111',
        votePower: 1,
        effects: true,
      });
    });

    expect(mocks.confetti).toHaveBeenCalledWith(
      expect.objectContaining({ colors: ['#111111', '#ffffff', '#FF5733'] }),
    );
    expect(mocks.vibrate).toHaveBeenCalledWith(40);
  });

  it('does not run success effects when the server rejects the vote', async () => {
    mocks.submitVoteApi.mockResolvedValue({
      success: false,
      voteScore: 0,
      remaining: 100,
      message: 'Vote rejected',
      errorCode: 'SUPABASE_ERROR',
    });

    const { result } = renderHook(() => useVote());

    await act(async () => {
      await result.current.submitVote({
        companyId: 'company-jyp',
        votePower: 100,
        effects: true,
      });
    });

    expect(mocks.confetti).not.toHaveBeenCalled();
    expect(mocks.vibrate).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
