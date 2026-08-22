/**
 * MEARROW voting policy constants.
 *
 * Keep UI defaults and client-side guards aligned with Supabase RPC policy.
 * Server-side enforcement lives in `submit_vote_secure` / `get_user_vote_stats`.
 */
export const VOTE_LIMITS = {
  /** Anonymous guest daily quota, tracked in localStorage on the client. */
  GUEST_DAILY: 100,
  /** Signed-in member daily quota. */
  MEMBER_DAILY: 300,
  /** Internal operator/owner daily quota, configured by DB override table. */
  OWNER_DAILY: 500,
  /** Maximum votes that can be cast with one long-press power vote. */
  POWER_MAX: 100,
  /** Kpopface embed: one long-press vote can cast at most 30 votes. */
  KPOPFACE_EMBED_POWER_MAX: 30,
} as const;
