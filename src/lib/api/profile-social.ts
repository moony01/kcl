import { getSupabase } from '@/lib/supabase/client';

export const PROFILE_POST_COMMENT_MAX_LENGTH = 200;
export const PROFILE_POST_COMMENT_PAGE_SIZE = 20;

export interface ProfilePostSocialRecord {
  post_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_viewer: boolean;
}

export interface ProfilePostCommentAuthor {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface ProfilePostCommentRecord {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: ProfilePostCommentAuthor | null;
}

export interface ProfilePostLikeResult {
  liked: boolean;
  likes_count: number;
}

export type ProfileSocialErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_CONTENT'
  | 'REQUEST_FAILED';

export class ProfileSocialError extends Error {
  code: ProfileSocialErrorCode;

  constructor(message: string, code: ProfileSocialErrorCode = 'REQUEST_FAILED') {
    super(message);
    this.name = 'ProfileSocialError';
    this.code = code;
  }
}

export function validateProfilePostCommentContent(value: string): string {
  const content = value.trim();
  if (!content) {
    throw new ProfileSocialError('댓글 내용을 입력해주세요.', 'INVALID_CONTENT');
  }
  if (content.length > PROFILE_POST_COMMENT_MAX_LENGTH) {
    throw new ProfileSocialError(
      '댓글은 ' + PROFILE_POST_COMMENT_MAX_LENGTH + '자 이하로 입력해주세요.',
      'INVALID_CONTENT',
    );
  }
  return content;
}

function toCount(value: unknown): number {
  const count = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function asRows<T>(data: T | T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data == null ? [] : [data];
}

export function normalizeProfilePostSocial(
  rows: Array<Partial<ProfilePostSocialRecord>> | null | undefined,
  postIds: readonly string[],
): ProfilePostSocialRecord[] {
  const byPostId = new Map((rows || []).map((row) => [row.post_id, row]));

  return [...new Set(postIds.filter(Boolean))].map((postId) => {
    const row = byPostId.get(postId);
    return {
      post_id: postId,
      likes_count: toCount(row?.likes_count),
      comments_count: toCount(row?.comments_count),
      liked_by_viewer: toBoolean(row?.liked_by_viewer),
    };
  });
}

async function requireAuthenticatedUser() {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) {
    throw new ProfileSocialError('로그인 후 이용할 수 있습니다.', 'AUTH_REQUIRED');
  }
  return data.user;
}

export async function getProfilePostSocial(
  postIds: readonly string[],
): Promise<ProfilePostSocialRecord[]> {
  const requestedIds = [...new Set(postIds.filter(Boolean))];
  if (requestedIds.length === 0) return [];

  const { data, error } = await getSupabase().rpc('get_profile_post_social', {
    p_post_ids: requestedIds,
  });
  if (error) throw new ProfileSocialError(error.message);

  return normalizeProfilePostSocial(
    asRows(data) as Array<Partial<ProfilePostSocialRecord>>,
    requestedIds,
  );
}

function mapComment(
  row: Omit<ProfilePostCommentRecord, 'author'>,
  author: ProfilePostCommentAuthor | null,
): ProfilePostCommentRecord {
  return { ...row, author };
}

async function hydrateComment(
  row: Omit<ProfilePostCommentRecord, 'author'>,
): Promise<ProfilePostCommentRecord> {
  const { data } = await getSupabase()
    .from('user_profiles')
    .select('id, username, avatar_url')
    .eq('id', row.user_id)
    .maybeSingle();

  return mapComment(row, (data || null) as ProfilePostCommentAuthor | null);
}

export async function listProfilePostComments(
  postId: string,
  options: { limit?: number } = {},
): Promise<ProfilePostCommentRecord[]> {
  const requestedLimit = options.limit ?? PROFILE_POST_COMMENT_PAGE_SIZE;
  const limit = Math.max(1, Math.min(Math.trunc(requestedLimit), 50));
  const { data, error } = await getSupabase()
    .from('profile_post_comments')
    .select('id, post_id, user_id, content, created_at, updated_at')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw new ProfileSocialError(error.message);

  const rows = (data || []) as Omit<ProfilePostCommentRecord, 'author'>[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (userIds.length === 0) return [];

  const { data: authors, error: authorsError } = await getSupabase()
    .from('user_profiles')
    .select('id, username, avatar_url')
    .in('id', userIds);
  if (authorsError) throw new ProfileSocialError(authorsError.message);

  const authorById = new Map(
    ((authors || []) as ProfilePostCommentAuthor[]).map((author) => [author.id, author]),
  );
  return rows.map((row) => mapComment(row, authorById.get(row.user_id) || null));
}

export async function createProfilePostComment(
  postId: string,
  value: string,
): Promise<ProfilePostCommentRecord> {
  await requireAuthenticatedUser();
  const content = validateProfilePostCommentContent(value);
  const { data, error } = await getSupabase().rpc('create_profile_post_comment', {
    p_post_id: postId,
    p_content: content,
  });
  if (error) throw new ProfileSocialError(error.message);

  const row = asRows(data)[0] as Omit<ProfilePostCommentRecord, 'author'> | undefined;
  if (!row) throw new ProfileSocialError('댓글을 등록하지 못했습니다.');
  return hydrateComment(row);
}

export async function deleteProfilePostComment(commentId: string): Promise<boolean> {
  await requireAuthenticatedUser();
  const { data, error } = await getSupabase().rpc('delete_profile_post_comment', {
    p_comment_id: commentId,
  });
  if (error) throw new ProfileSocialError(error.message);
  return toBoolean(data);
}

export async function toggleProfilePostLike(
  postId: string,
  shouldLike: boolean,
): Promise<ProfilePostLikeResult> {
  await requireAuthenticatedUser();
  const { data, error } = await getSupabase().rpc('toggle_profile_post_like', {
    p_post_id: postId,
    p_liked: shouldLike,
  });
  if (error) throw new ProfileSocialError(error.message);

  const row = asRows(data)[0] as
    | { liked?: unknown; likes_count?: unknown }
    | undefined;
  if (!row) throw new ProfileSocialError('좋아요 상태를 변경하지 못했습니다.');

  return {
    liked: toBoolean(row.liked),
    likes_count: toCount(row.likes_count),
  };
}
