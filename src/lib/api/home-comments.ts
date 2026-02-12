/**
 * KCL 메인 페이지 댓글 Supabase API 레이어
 * 클라이언트 사이드에서 홈 댓글 CRUD 처리
 * 뉴스 댓글(news-comments.ts)과 동일 패턴, slug 없는 글로벌 댓글
 */

import { createClient } from '@/lib/supabase/client';

/** 홈 댓글 타입 */
export interface HomeComment {
  id: string;
  author_name: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** 댓글 작성 요청 */
export interface CreateHomeCommentRequest {
  author_name: string;
  password: string;
  content: string;
}

/** 댓글 삭제 요청 */
export interface DeleteHomeCommentRequest {
  id: string;
  password: string;
}

/**
 * 홈 댓글 목록 조회
 * @param limit - 조회 개수 (기본 50)
 * @param offset - 오프셋 (페이지네이션)
 * @returns 댓글 배열
 */
export async function getHomeComments(
  limit: number = 50,
  offset: number = 0,
): Promise<HomeComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_home_comments')
    .select('id, author_name, content, is_deleted, created_at, updated_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[home-comments] 목록 조회 실패:', error);
    return [];
  }

  return data || [];
}

/**
 * 댓글 작성 (보안 강화 버전)
 * 서버 사이드 RPC로 bcrypt 해싱 처리
 * @param req - 댓글 작성 요청
 * @returns 생성된 댓글 또는 null
 */
export async function createHomeComment(
  req: CreateHomeCommentRequest,
): Promise<HomeComment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('create_kcl_home_comment_secure', {
      p_author_name: req.author_name.trim(),
      p_password: req.password.trim(),
      p_content: req.content.trim(),
    })
    .single();

  if (error) {
    console.error('[home-comments] 댓글 작성 실패:', error);
    return null;
  }

  return data;
}

/**
 * 댓글 삭제 (보안 강화 버전 - soft delete)
 * 서버 사이드 RPC로 비밀번호 검증 처리
 * @param req - 삭제 요청 (id + password)
 * @returns 성공 여부
 */
export async function deleteHomeComment(
  req: DeleteHomeCommentRequest,
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('delete_kcl_home_comment_secure', {
      p_id: req.id,
      p_password: req.password.trim(),
    });

  if (error) {
    console.error('[home-comments] 삭제 실패:', error);
    return false;
  }

  return data === true;
}

/**
 * 홈 댓글 총 개수 조회
 * @returns 댓글 수
 */
export async function getHomeCommentCount(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_kcl_home_comment_count');

  if (error) {
    return 0;
  }

  return data || 0;
}
