/**
 * Canonical VoteBoard entrypoint.
 *
 * The home company-card board is the product source of truth. Keep this
 * import path as a compatibility boundary for iframe and partner callers, but
 * do not maintain a second ranking/selection implementation here.
 */
export {
  default,
  HOME_DIRECT_VOTE_UNIT,
} from '@/components/features/home/HomeCompanyList';
export type {
  HomeCompanyListProps as VoteBoardProps,
  HomeVoteState,
  HomeVoteStatus,
} from '@/components/features/home/HomeCompanyList';
