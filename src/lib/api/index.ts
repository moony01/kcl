/**
 * API Layer Index
 *
 * SSG/CSR 마이그레이션: 브라우저에서 Supabase 직접 호출
 * 기존 API Routes(/api/*)를 대체합니다.
 *
 * 사용법:
 * ```typescript
 * import { getCompanies, submitVote, getHallOfFame } from '@/lib/api';
 *
 * // 소속사 목록 조회
 * const { companies } = await getCompanies();
 *
 * // 투표 제출
 * const result = await submitVote({ companyId: 'uuid' });
 *
 * // 명예의 전당 조회
 * const hallOfFame = await getHallOfFame();
 * ```
 */

// Companies API
export {
  getCompanies,
  type GetCompaniesOptions,
} from './companies';

// Vote API
export {
  submitVote,
  resetDevelopmentTestVoteQuota,
  getKpopfaceEmbedVoteStatus,
  getVoteStats,
  getUserVoteStats,
  KPOPFACE_EMBED_POWER_MAX,
  type SubmitVoteParams,
  type VoteResult,
  type KpopfaceEmbedVoteStatus,
  type VoteStats,
  type UserVoteStats,
  type DevelopmentVoteQuotaResetResult,
} from './vote';

// Hall of Fame API
export { getHallOfFame } from './hall-of-fame';
