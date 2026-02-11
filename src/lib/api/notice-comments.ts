/**
 * KCL 공지사항 댓글 Supabase API 레이어
 * 클라이언트 사이드에서 공지사항 댓글 CRUD 처리
 * news-comments.ts 패턴을 복제 (slug → announcement_id)
 */

import { createClient } from '@/lib/supabase/client';

/** 공지사항 댓글 타입 */
export interface NoticeComment {
  id: string;
  announcement_id: string;
  author_name: string;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** 댓글 작성 요청 */
export interface CreateNoticeCommentRequest {
  announcement_id: string;
  author_name: string;
  password: string;
  content: string;
}

/** 댓글 삭제 요청 */
export interface DeleteNoticeCommentRequest {
  id: string;
  password: string;
}

/**
 * 특정 공지사항의 댓글 목록 조회
 * @param announcementId - 공지사항 UUID
 * @param limit - 조회 개수 (기본 50)
 * @param offset - 오프셋 (페이지네이션)
 * @returns 댓글 배열
 */
export async function getNoticeComments(
  announcementId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<NoticeComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_notice_comments')
    .select('id, announcement_id, author_name, content, is_deleted, created_at, updated_at')
    .eq('announcement_id', announcementId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[notice-comments] 목록 조회 실패:', error);
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
export async function createNoticeComment(
  req: CreateNoticeCommentRequest,
): Promise<NoticeComment | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('create_kcl_notice_comment_secure', {
      p_announcement_id: req.announcement_id,
      p_author_name: req.author_name.trim(),
      p_password: req.password.trim(),
      p_content: req.content.trim(),
    })
    .single();

  if (error) {
    console.error('[notice-comments] 댓글 작성 실패:', error);
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
export async function deleteNoticeComment(
  req: DeleteNoticeCommentRequest,
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('delete_kcl_notice_comment_secure', {
      p_id: req.id,
      p_password: req.password.trim(),
    });

  if (error) {
    console.error('[notice-comments] 삭제 실패:', error);
    return false;
  }

  return data === true;
}

/**
 * 특정 공지사항의 댓글 수 조회
 * @param announcementId - 공지사항 UUID
 * @returns 댓글 수
 */
export async function getNoticeCommentCount(announcementId: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('get_kcl_notice_comment_count', { p_announcement_id: announcementId });

  if (error) {
    return 0;
  }

  return data || 0;
}

/**
 * 여러 공지사항의 댓글 수를 한번에 배치 조회
 * 목록 페이지에서 각 게시글의 댓글 수를 효율적으로 가져오기 위해 사용
 * @param announcementIds - 공지사항 UUID 배열
 * @returns id → 댓글 수 맵 (Record<string, number>)
 */
export async function getNoticeCommentCounts(
  announcementIds: string[],
): Promise<Record<string, number>> {
  if (announcementIds.length === 0) return {};

  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_notice_comments')
    .select('announcement_id')
    .in('announcement_id', announcementIds)
    .eq('is_deleted', false);

  if (error) {
    console.error('[notice-comments] 배치 댓글 수 조회 실패:', error);
    return {};
  }

  // announcement_id별로 그룹 카운팅
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.announcement_id] = (counts[row.announcement_id] || 0) + 1;
  }

  return counts;
}
