import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTodayUTC,
  resetGuestVoteQuota,
  VOTE_QUOTA_REFRESH_EVENT,
  VOTE_QUOTA_STORAGE_KEY,
} from '@/lib/vote-quota';
import { VOTE_LIMITS } from '@/config/vote';

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
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    resetGuestVoteQuota();

    expect(JSON.parse(window.localStorage.getItem(VOTE_QUOTA_STORAGE_KEY) ?? '')).toEqual({
      date: getTodayUTC(),
      used: 0,
      max: VOTE_LIMITS.GUEST_DAILY,
    });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    const lastEvent = dispatchSpy.mock.calls[dispatchSpy.mock.calls.length - 1]?.[0];
    expect(lastEvent).toMatchObject({ type: VOTE_QUOTA_REFRESH_EVENT });
  });

  it('does not call server APIs', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    resetGuestVoteQuota();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
