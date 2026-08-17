import { VOTE_LIMITS } from '@/config/vote';

/** localStorage key for the anonymous guest quota. */
export const VOTE_QUOTA_STORAGE_KEY = 'kcl_vote_quota';

/** Browser event emitted after the guest quota is refreshed locally. */
export const VOTE_QUOTA_REFRESH_EVENT = 'kcl:vote-quota-refresh';

/** UTC date in YYYY-MM-DD form. */
export function getTodayUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Reset only the browser-local guest quota from development tools.
 *
 * This function deliberately has no Supabase or server dependency.
 */
export function resetGuestVoteQuota(): void {
  if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') return;

  const data = {
    date: getTodayUTC(),
    used: 0,
    max: VOTE_LIMITS.GUEST_DAILY,
  };

  try {
    window.localStorage.setItem(VOTE_QUOTA_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(VOTE_QUOTA_REFRESH_EVENT));
  } catch {
    // Storage restrictions should not trigger a misleading refresh.
  }
}
