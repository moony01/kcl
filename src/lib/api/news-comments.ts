/**
 * MEARROW 뉴스 댓글 Supabase API 레이어
 * 클라이언트 사이드에서 뉴스 댓글 CRUD 처리
 */

import { createClient } from '@/lib/supabase/client';

/**
 * 비밀번호 정규화 — 유니코드 제어문자/보이지 않는 공백 제거
 */
function sanitizePassword(pw: string): string {
  return pw.trim().replace(/[\x01-\x1F\x7F\xA0\u200B-\u200D\uFEFF]/g, '');
}

/** 뉴스 댓글 타입 */
export interface NewsComment {
  id: string;
  slug: string;
  author_name: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** 댓글 작성 요청 */
export interface CreateNewsCommentRequest {
  slug: string;
  author_name: string;
  password: string;
  content: string;
}

/** 댓글 삭제 요청 */
export interface DeleteNewsCommentRequest {
  id: string;
  password: string;
}

/**
 * 특정 뉴스의 댓글 목록 조회
 * @param slug - 뉴스 식별자
 * @param limit - 조회 개수 (기본 50)
 * @param offset - 오프셋 (페이지네이션)
 * @returns 댓글 배열
 */
export async function getNewsComments(
  slug: string,
  limit: number = 50,
  offset: number = 0,
  signal?: AbortSignal,
): Promise<NewsComment[]> {
  const supabase = createClient();

  const query = supabase
    .from('news_comments')
    .select('id, slug, author_name, content, is_deleted, created_at, updated_at')
    .eq('slug', slug)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  const { data, error } = signal ? await query.abortSignal(signal) : await query;

  if (error) {
    if (!signal?.aborted) {
      console.error('[news-comments] 목록 조회 실패:', error);
    }
    return [];
  }

  return data || [];
}

/**
 * 댓글 작성 (보안 강화 버전)
 * T1.2: 서버 사이드 RPC로 bcrypt 해싱 처리
 * - 비밀번호가 클라이언트에서 해싱되지 않음 (서버에서 bcrypt 처리)
 * - 서버 사이드 입력값 검증
 * - SECURITY DEFINER로 RLS 우회하여 안전한 삽입
 * @param req - 댓글 작성 요청
 * @returns 생성된 댓글 또는 null
 */
export async function createNewsComment(
  req: CreateNewsCommentRequest,
): Promise<NewsComment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('create_kcl_news_comment_secure', {
      p_slug: req.slug,
      p_author_name: req.author_name.trim(),
      p_password: sanitizePassword(req.password),
      p_content: req.content.trim(),
    })
    .single();

  if (error) {
    console.error('[news-comments] 댓글 작성 실패:', error);
    return null;
  }

  return data as NewsComment;
}

/**
 * 댓글 삭제 (보안 강화 버전 - soft delete)
 * T1.2: 서버 사이드 RPC로 비밀번호 검증 처리
 * - password_hash가 클라이언트에 노출되지 않음
 * - bcrypt 검증 서버에서 수행
 * - 기존 base64 댓글도 폴백으로 삭제 가능
 * @param req - 삭제 요청 (id + password)
 * @returns 성공 여부
 */
export async function deleteNewsComment(
  req: DeleteNewsCommentRequest,
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('delete_kcl_news_comment_secure', {
      p_id: req.id,
      p_password: sanitizePassword(req.password),
    });

  if (error) {
    console.error('[news-comments] 삭제 실패:', error);
    return false;
  }

  return data === true;
}

/**
 * 특정 뉴스의 댓글 수 조회
 * @param slug - 뉴스 식별자
 * @returns 댓글 수
 */
export async function getNewsCommentCount(slug: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_kcl_news_comment_count', { p_slug: slug });

  if (error) {
    return 0;
  }

  return data || 0;
}

/**
 * 여러 뉴스의 댓글 수를 한번에 배치 조회
 * 목록 페이지에서 각 뉴스 기사의 댓글 수를 효율적으로 가져오기 위해 사용
 * @param slugs - 뉴스 slug 배열
 * @returns slug → 댓글 수 맵 (Record<string, number>)
 */
export async function getNewsCommentCounts(
  slugs: string[],
  signal?: AbortSignal,
): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};

  const supabase = createClient();

  const query = supabase
    .from('news_comments')
    .select('slug')
    .in('slug', slugs)
    .eq('is_deleted', false);
  const { data, error } = signal ? await query.abortSignal(signal) : await query;

  if (error) {
    if (!signal?.aborted) {
      console.error('[news-comments] 배치 댓글 수 조회 실패:', error);
    }
    return {};
  }

  // slug별로 그룹 카운팅
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.slug] = (counts[row.slug] || 0) + 1;
  }

  return counts;
}
