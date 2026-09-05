import { getSupabase } from '@/lib/supabase/client';

export type FollowTargetType = 'company' | 'group';

export interface FollowingState {
  companyIds: string[];
  groupIds: string[];
}

export type FollowingErrorCode = 'AUTH_REQUIRED' | 'INVALID_TARGET' | 'REQUEST_FAILED';

export class FollowingError extends Error {
  code: FollowingErrorCode;

  constructor(message: string, code: FollowingErrorCode = 'REQUEST_FAILED') {
    super(message);
    this.name = 'FollowingError';
    this.code = code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeTargetId(value: string): string {
  if (typeof value !== 'string') {
    throw new FollowingError('관심 대상 식별자가 올바르지 않습니다.', 'INVALID_TARGET');
  }

  const targetId = value.trim();
  if (!UUID_PATTERN.test(targetId)) {
    throw new FollowingError('관심 대상 식별자가 올바르지 않습니다.', 'INVALID_TARGET');
  }
  return targetId;
}

function normalizeTargetType(value: FollowTargetType): FollowTargetType {
  if (value !== 'company' && value !== 'group') {
    throw new FollowingError('관심 대상 유형이 올바르지 않습니다.', 'INVALID_TARGET');
  }
  return value;
}

async function requireAuthenticatedUser() {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) {
    throw new FollowingError('로그인 후 이용할 수 있습니다.', 'AUTH_REQUIRED');
  }
  return data.user;
}

function normalizeIds(data: unknown, field: 'company_id' | 'group_id'): string[] {
  if (!Array.isArray(data)) return [];

  return [...new Set(
    data
      .map((row) => (row && typeof row === 'object' ? (row as Record<string, unknown>)[field] : null))
      .filter((value): value is string => typeof value === 'string' && UUID_PATTERN.test(value)),
  )];
}

/** Read only the current authenticated user's follow relationships. */
export async function getMyFollowing(): Promise<FollowingState> {
  const user = await requireAuthenticatedUser();
  const supabase = getSupabase();

  const [companyResult, groupResult] = await Promise.all([
    supabase
      .from('company_follows')
      .select('company_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('group_follows')
      .select('group_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (companyResult.error) {
    throw new FollowingError(companyResult.error.message);
  }
  if (groupResult.error) {
    throw new FollowingError(groupResult.error.message);
  }

  return {
    companyIds: normalizeIds(companyResult.data, 'company_id'),
    groupIds: normalizeIds(groupResult.data, 'group_id'),
  };
}

function readFollowResult(data: unknown): boolean {
  const row = Array.isArray(data) ? data[0] : data;
  if (typeof row === 'boolean') return row;
  if (row && typeof row === 'object') {
    const value = (row as Record<string, unknown>).is_following
      ?? (row as Record<string, unknown>).following;
    if (typeof value === 'boolean') return value;
  }
  throw new FollowingError('관심 상태를 확인하지 못했습니다.');
}

/** Toggle a follow through an auth.uid()-bound RPC. */
export async function toggleFollow(
  targetType: FollowTargetType,
  targetId: string,
  shouldFollow: boolean,
): Promise<boolean> {
  const normalizedTargetType = normalizeTargetType(targetType);
  const normalizedTargetId = normalizeTargetId(targetId);
  if (typeof shouldFollow !== 'boolean') {
    throw new FollowingError('관심 상태가 올바르지 않습니다.', 'INVALID_TARGET');
  }
  await requireAuthenticatedUser();

  const rpcName = normalizedTargetType === 'company'
    ? 'toggle_company_follow'
    : 'toggle_group_follow';
  const params = normalizedTargetType === 'company'
    ? { p_company_id: normalizedTargetId, p_follow: shouldFollow }
    : { p_group_id: normalizedTargetId, p_follow: shouldFollow };
  const { data, error } = await getSupabase().rpc(rpcName, params);

  if (error) {
    throw new FollowingError(error.message);
  }

  return readFollowResult(data);
}
