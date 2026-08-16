import { getKpopfaceEmbedVoteStatus, KPOPFACE_EMBED_POWER_MAX } from '@/lib/api';
import { VOTE_LIMITS } from '@/config/vote';

export type VoteSource = 'web' | 'kpopface_embed';

/** Server-authoritative quota fields used by an embed policy. */
export interface VotePolicyStatus {
  canVote: boolean;
  hasUsedEmbed?: boolean;
  remaining: number;
  maxVotePower: number;
}

/**
 * Surface-specific policy only. VoteBoard/VoteController keep the shared
 * ranking, selection, power-press, and sheet interaction.
 */
export interface VotePolicyAdapter {
  id: 'web' | 'kpopface-embed';
  voteSource: VoteSource;
  guestDailyLimit: number;
  storageKey?: string;
  maxPowerLevel: number;
  readStatus?: (userId?: string | null) => Promise<VotePolicyStatus | null>;
}

export const WEB_VOTE_POLICY: VotePolicyAdapter = {
  id: 'web',
  voteSource: 'web',
  guestDailyLimit: VOTE_LIMITS.GUEST_DAILY,
  maxPowerLevel: VOTE_LIMITS.POWER_MAX,
};

export const KPOPFACE_EMBED_VOTE_POLICY: VotePolicyAdapter = {
  id: 'kpopface-embed',
  voteSource: 'kpopface_embed',
  guestDailyLimit: 30,
  storageKey: 'kcl_kpopface_embed_quota',
  maxPowerLevel: KPOPFACE_EMBED_POWER_MAX,
  async readStatus(userId) {
    const status = await getKpopfaceEmbedVoteStatus(userId);
    if (!status) return null;

    return {
      canVote: status.canVote,
      hasUsedEmbed: status.hasUsedEmbed,
      remaining: status.remaining,
      maxVotePower: status.maxVotePower,
    };
  },
};
