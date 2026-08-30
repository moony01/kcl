import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTodayUTC,
  GUEST_VOTER_ID_STORAGE_KEY,
  resetGuestVoteQuota,
  VOTE_QUOTA_REFRESH_EVENT,
  VOTE_QUOTA_STORAGE_KEY,
} from '@/lib/vote-quota';
import { VOTE_LIMITS } from '@/config/vote';
import {
  DEVELOPMENT_TEST_MODE_STORAGE_KEY,
  DEVELOPMENT_TEST_USER_ID,
} from '@/lib/auth/development-test-mode';

vi.mock('@/lib/api', () => ({
  getUserVoteStats: vi.fn(),
}));

describe('guest vote quota developer reset', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("writes today's UTC guest quota locally and dispatches refresh", () => {
    window.localStorage.setItem(GUEST_VOTER_ID_STORAGE_KEY, 'used-guest');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    resetGuestVoteQuota();

    expect(JSON.parse(window.localStorage.getItem(VOTE_QUOTA_STORAGE_KEY) ?? '')).toEqual({
      date: getTodayUTC(),
      used: 0,
      max: VOTE_LIMITS.GUEST_DAILY,
    });
    expect(window.localStorage.getItem(GUEST_VOTER_ID_STORAGE_KEY)).toBeNull();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const lastEvent = dispatchSpy.mock.calls[dispatchSpy.mock.calls.length - 1]?.[0];
    expect(lastEvent).toMatchObject({ type: VOTE_QUOTA_REFRESH_EVENT });
  });

  it('does not call server APIs', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    resetGuestVoteQuota();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('updates a mounted guest quota through the refresh event', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useVoteQuota } = await import('@/hooks/useVoteQuota');
    const { result } = renderHook(() => useVoteQuota());

    expect(result.current.isLoading).toBe(false);
    act(() => {
      expect(result.current.useVote(3)).toBe(true);
    });
    expect(result.current.quota.used).toBe(3);

    act(() => {
      resetGuestVoteQuota();
    });

    expect(result.current.quota.used).toBe(0);
    expect(result.current.quota.remaining).toBe(VOTE_LIMITS.GUEST_DAILY);
  });

  it('uses the member quota for the local developer session', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    const { act, renderHook, waitFor } = await import('@testing-library/react');
    const { useVoteQuota } = await import('@/hooks/useVoteQuota');
    const { result } = renderHook(() => useVoteQuota(DEVELOPMENT_TEST_USER_ID));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quota.max).toBe(VOTE_LIMITS.MEMBER_DAILY);
    act(() => {
      expect(result.current.useVote(1)).toBe(true);
    });
    expect(result.current.quota.used).toBe(1);

    act(() => {
      resetGuestVoteQuota();
    });

    expect(result.current.quota.used).toBe(0);
    expect(result.current.quota.remaining).toBe(VOTE_LIMITS.MEMBER_DAILY);

    act(() => {
      expect(result.current.useVote(VOTE_LIMITS.MEMBER_DAILY)).toBe(true);
    });
    expect(result.current.quota.remaining).toBe(0);
  });

  it('is a no-op in production even when a local quota exists', () => {
    window.localStorage.setItem(
      VOTE_QUOTA_STORAGE_KEY,
      JSON.stringify({ date: getTodayUTC(), used: 7, max: VOTE_LIMITS.GUEST_DAILY }),
    );
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    vi.stubEnv('NODE_ENV', 'production');

    resetGuestVoteQuota();

    expect(JSON.parse(window.localStorage.getItem(VOTE_QUOTA_STORAGE_KEY) ?? '')).toMatchObject({
      used: 7,
    });
    expect(dispatchSpy).not.toHaveBeenCalledWith(expect.any(Event));
  });
});
