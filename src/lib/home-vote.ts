/**
 * Shared direct-vote defaults for the canonical home/embed board.
 *
 * Surface-specific policies may lower the available amount (for example the
 * Kpopface embed quota), but the board itself always renders the same 100-vote
 * feedback scale.
 */
export const HOME_DIRECT_VOTE_UNIT = 100;

export function getDirectVoteAmount(
  remaining: number,
  voteUnit = HOME_DIRECT_VOTE_UNIT,
): number {
  if (!Number.isFinite(remaining) || !Number.isFinite(voteUnit)) return 0;

  const normalizedUnit = Math.max(1, Math.floor(voteUnit));
  return Math.min(normalizedUnit, Math.max(0, Math.floor(remaining)));
}

export function getSuccessfulVoteScore(
  voteScore: number | undefined,
  requested: number,
): number {
  if (!Number.isFinite(voteScore)) return requested;
  return Math.min(requested, Math.max(1, Math.floor(voteScore as number)));
}

export function getRemainingAfterVote(
  serverRemaining: number | undefined,
  currentRemaining: number,
  consumed: number,
): number {
  if (Number.isFinite(serverRemaining)) {
    return Math.max(0, Math.floor(serverRemaining as number));
  }
  return Math.max(0, currentRemaining - consumed);
}
