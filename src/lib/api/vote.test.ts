import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEVELOPMENT_TEST_MODE_STORAGE_KEY,
  DEVELOPMENT_TEST_USER_ID,
} from '@/lib/auth/development-test-mode';
import { resetDevelopmentTestVoteQuota, submitVote } from './vote';

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: mocks.getSupabase,
}));

describe('submitVote developer session boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.clear();
    mocks.getSupabase.mockReset();
    mocks.rpc.mockReset();
    mocks.getSupabase.mockReturnValue({ rpc: mocks.rpc });
    mocks.rpc.mockResolvedValue({
      data: {
        success: true,
        message: 'Vote successful',
        current_score: 101,
        vote_score: 1,
        remaining: 99,
      },
      error: null,
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('uses the provisioned member identity when the local developer session votes', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    const result = await submitVote({
      companyId: 'company-id',
      userId: DEVELOPMENT_TEST_USER_ID,
    });

    expect(result.success).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'submit_vote_secure',
      expect.objectContaining({
        p_user_id: DEVELOPMENT_TEST_USER_ID,
        p_daily_limit: 100,
        p_fingerprint: null,
      }),
    );
  });

  it('keeps a real authenticated user id on the member path', async () => {
    const result = await submitVote({
      companyId: 'company-id',
      userId: 'real-user-id',
    });

    expect(result.success).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'submit_vote_secure',
      expect.objectContaining({
        p_user_id: 'real-user-id',
        p_fingerprint: null,
      }),
    );
  });

  it('resets the local developer fixture through the server RPC', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');
    mocks.rpc.mockResolvedValueOnce({
      data: { success: true, deleted_votes: 3, deleted_score: 300 },
      error: null,
    });

    await expect(resetDevelopmentTestVoteQuota()).resolves.toEqual({
      success: true,
      deletedVotes: 3,
      deletedScore: 300,
    });
    expect(mocks.rpc).toHaveBeenCalledWith('reset_development_test_vote_quota');
  });
});
