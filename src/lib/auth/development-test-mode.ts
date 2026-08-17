/**
 * Development-only local test mode.
 *
 * This marker is a browser-local developer test session. It is deliberately
 * ignored outside development so it cannot affect production authentication.
 */
import type { User } from '@supabase/supabase-js';

export const DEVELOPMENT_TEST_MODE_STORAGE_KEY = 'kcl_dev_test_mode';
export const DEVELOPMENT_TEST_USER_ID = '00000000-0000-4013-8013-000000000013';

/** A deterministic local-only user for exercising authenticated UI flows. */
export function getDevelopmentTestUser(): User {
  return {
    id: DEVELOPMENT_TEST_USER_ID,
    app_metadata: { provider: 'developer', providers: ['developer'] },
    user_metadata: {
      name: 'Developer Test',
      full_name: 'Developer Test',
    },
    aud: 'authenticated',
    email: 'developer@localhost.test',
    role: 'authenticated',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    identities: [],
    is_anonymous: false,
  };
}

/**
 * Return the user id that may safely be sent to persisted backend operations.
 *
 * The local developer session has no corresponding row in Supabase auth.users,
 * so vote writes must use the guest/fingerprint path instead of violating the
 * kcl_votes.user_id foreign key.
 */
export function getVoteBackendUserId(userId?: string | null): string | null {
  if (!userId) return null;

  return isDevelopmentTestModeEnabled() && userId === DEVELOPMENT_TEST_USER_ID
    ? null
    : userId;
}

export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isDevelopmentTestModeEnabled(): boolean {
  if (!isDevelopmentEnvironment() || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDevelopmentTestModeEnabled(enabled: boolean): void {
  if (!isDevelopmentEnvironment() || typeof window === 'undefined') return;

  try {
    if (enabled) {
      window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY);
    }
  } catch {
    // Private browsing/storage restrictions should not affect auth behavior.
  }
}

/** Backward-compatible page refresh helper for older development worktrees. */
export function reloadDevelopmentTestPage(): void {
  if (!isDevelopmentEnvironment() || typeof window === 'undefined') return;

  window.location.reload();
}

export function clearDevelopmentTestMode(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY);
  } catch {
    // Private browsing/storage restrictions should not block sign-out cleanup.
  }
}
