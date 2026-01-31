/**
 * Community API Layer
 *
 * 커뮤니티(자유게시판) 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/community/* 대체
 *
 * 테이블: kcl_posts, kcl_post_comments, kcl_reports
 */

import { getSupabase } from '@/lib/supabase/client';
import type {
  PostsResponse,
  PostDetailResponse,
  Post,
  PostListItem,
  PostComment,
  CreatePostRequest,
  CreateCommentRequest,
  CommunityAPIResponse,
} from '@/types/community';

/** 기본 페이지 크기 */
const DEFAULT_LIMIT = 20;
/** 최대 페이지 크기 */
const MAX_LIMIT = 50;

/**
 * 모든 게시글 ID 조회 (정적 생성용)
 *
 * SSG 빌드 시 generateStaticParams()에서 호출하여
 * 모든 게시글 경로를 정적으로 생성합니다.
 *
 * @returns 게시글 ID 배열
 */
export async function getAllPostIds(): Promise<string[]> {
  const supabase = getSupabase();

  try {
    const { data: posts, error } = await supabase
      .from('kcl_posts')
      .select('id')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAllPostIds] Failed to fetch post IDs:', error.message);
      return [];
    }

    return (posts || []).map((post) => post.id);
  } catch (error) {
    console.error('[getAllPostIds] Unexpected error:', error);
    return [];
  }
}

// ============================================
// 게시글 관련 함수
// ============================================

/** 게시글 목록 조회 옵션 */
export interface GetPostsOptions {
  /** 페이지 번호 (1부터 시작) */
  page?: number;
  /** 페이지당 개수 */
  limit?: number;
}

/**
 * 게시글 목록 조회
 *
 * @param options - 조회 옵션
 * @returns 페이지네이션된 게시글 목록
 */
export async function getPosts(options: GetPostsOptions = {}): Promise<PostsResponse> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, options.limit || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  const supabase = getSupabase();

  try {
    // 게시글 목록 조회 (최신순)
    const { data: posts, error: postsError } = await supabase
      .from('kcl_posts')
      .select('id, nickname, title, view_count, comment_count, created_at')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (postsError) {
      console.error('[getPosts] Failed to fetch posts:', postsError.message);
      throw postsError;
    }

    // 전체 개수 조회
    const { count, error: countError } = await supabase
      .from('kcl_posts')
      .select('*', { count: 'exact', head: true })
      .eq('is_hidden', false);

    if (countError) {
      console.error('[getPosts] Failed to count posts:', countError.message);
    }

    const totalCount = count ?? 0;
    const hasMore = offset + limit < totalCount;

    return {
      posts: (posts as PostListItem[]) || [],
      totalCount,
      page,
      limit,
      hasMore,
    };
  } catch (error) {
    console.error('[getPosts] Unexpected error:', error);
    return {
      posts: [],
      totalCount: 0,
      page,
      limit,
      hasMore: false,
    };
  }
}

/**
 * 게시글 상세 조회
 *
 * @param postId - 게시글 UUID
 * @returns 게시글 상세 및 댓글 목록
 */
export async function getPostById(
  postId: string,
): Promise<PostDetailResponse & { error?: string }> {
  const supabase = getSupabase();

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(postId)) {
    return {
      post: null as unknown as Post,
      comments: [],
      error: 'Invalid post ID format',
    };
  }

  try {
    // 게시글 조회
    const { data: post, error: postError } = await supabase
      .from('kcl_posts')
      .select('id, nickname, title, content, view_count, comment_count, created_at')
      .eq('id', postId)
      .eq('is_hidden', false)
      .single();

    if (postError || !post) {
      console.error('[getPostById] Post not found:', postError?.message);
      return {
        post: null as unknown as Post,
        comments: [],
        error: 'Post not found',
      };
    }

    // 조회수 증가 (비동기, 실패해도 무시)
    supabase
      .from('kcl_posts')
      .update({ view_count: post.view_count + 1 })
      .eq('id', postId)
      .then((result: { error: { message: string } | null }) => {
        if (result.error) {
          console.warn('[getPostById] Failed to increment view count:', result.error.message);
        }
      });

    // 댓글 목록 조회
    const { data: comments, error: commentsError } = await supabase
      .from('kcl_post_comments')
      .select('id, post_id, nickname, content, created_at')
      .eq('post_id', postId)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.warn('[getPostById] Failed to fetch comments:', commentsError.message);
    }

    return {
      post: post as Post,
      comments: (comments as PostComment[]) || [],
    };
  } catch (error) {
    console.error('[getPostById] Unexpected error:', error);
    return {
      post: null as unknown as Post,
      comments: [],
      error: 'Failed to fetch post',
    };
  }
}

/** 게시글 작성 결과 */
export interface CreatePostResult extends CommunityAPIResponse {
  post?: Post;
}

/**
 * 게시글 작성
 *
 * @param data - 게시글 데이터
 * @returns 작성 결과
 */
export async function createPost(data: CreatePostRequest): Promise<CreatePostResult> {
  const { nickname, title, content } = data;
  const supabase = getSupabase();

  // 입력 유효성 검증
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return { success: false, message: 'Nickname must be 2-20 characters' };
  }

  if (!title || title.length < 2 || title.length > 100) {
    return { success: false, message: 'Title must be 2-100 characters' };
  }

  if (!content || content.length < 10 || content.length > 10000) {
    return { success: false, message: 'Content must be 10-10,000 characters' };
  }

  try {
    // 게시글 생성
    const { data: newPost, error: insertError } = await supabase
      .from('kcl_posts')
      .insert({
        nickname: nickname.trim(),
        title: title.trim(),
        content: content.trim(),
        // ip_hash는 서버에서만 설정 가능
      })
      .select('id, nickname, title, content, view_count, comment_count, created_at')
      .single();

    if (insertError) {
      console.error('[createPost] Failed to create post:', insertError.message);
      return { success: false, message: 'Failed to create post' };
    }

    return {
      success: true,
      message: 'Post created successfully',
      post: newPost as Post,
    };
  } catch (error) {
    console.error('[createPost] Unexpected error:', error);
    return { success: false, message: 'Failed to create post' };
  }
}

// ============================================
// 댓글 관련 함수
// ============================================

/** 댓글 작성 결과 */
export interface CreateCommentResult extends CommunityAPIResponse {
  comment?: PostComment;
}

/**
 * 댓글 작성
 *
 * @param postId - 게시글 UUID
 * @param data - 댓글 데이터
 * @returns 작성 결과
 */
export async function createComment(
  postId: string,
  data: CreateCommentRequest,
): Promise<CreateCommentResult> {
  const { nickname, content } = data;
  const supabase = getSupabase();

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(postId)) {
    return { success: false, message: 'Invalid post ID format' };
  }

  // 입력 유효성 검증
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    return { success: false, message: 'Nickname must be 2-20 characters' };
  }

  if (!content || content.length < 1 || content.length > 500) {
    return { success: false, message: 'Comment must be 1-500 characters' };
  }

  try {
    // 게시글 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('kcl_posts')
      .select('id')
      .eq('id', postId)
      .eq('is_hidden', false)
      .single();

    if (postError || !post) {
      return { success: false, message: 'Post not found' };
    }

    // 댓글 생성
    const { data: newComment, error: insertError } = await supabase
      .from('kcl_post_comments')
      .insert({
        post_id: postId,
        nickname: nickname.trim(),
        content: content.trim(),
        // ip_hash는 서버에서만 설정 가능
      })
      .select('id, post_id, nickname, content, created_at')
      .single();

    if (insertError) {
      console.error('[createComment] Failed to create comment:', insertError.message);
      return { success: false, message: 'Failed to create comment' };
    }

    return {
      success: true,
      message: 'Comment created successfully',
      comment: newComment as PostComment,
    };
  } catch (error) {
    console.error('[createComment] Unexpected error:', error);
    return { success: false, message: 'Failed to create comment' };
  }
}

// ============================================
// 신고 관련 함수
// ============================================

/** 신고 요청 파라미터 */
export interface SubmitReportParams {
  /** 신고 대상 타입 */
  targetType: 'post' | 'comment';
  /** 신고 대상 ID */
  targetId: string;
  /** 신고 사유 (선택) */
  reason?: string;
}

/**
 * 신고 제출
 *
 * @param params - 신고 파라미터
 * @returns 신고 결과
 */
export async function submitReport(params: SubmitReportParams): Promise<CommunityAPIResponse> {
  const { targetType, targetId, reason } = params;
  const supabase = getSupabase();

  // 입력 유효성 검증
  if (!targetType || !['post', 'comment'].includes(targetType)) {
    return { success: false, message: 'Invalid target_type. Must be "post" or "comment"' };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!targetId || !uuidRegex.test(targetId)) {
    return { success: false, message: 'Invalid target_id format' };
  }

  if (reason && reason.length > 200) {
    return { success: false, message: 'Reason must be at most 200 characters' };
  }

  try {
    // 대상 존재 여부 확인
    if (targetType === 'post') {
      const { data: post } = await supabase
        .from('kcl_posts')
        .select('id')
        .eq('id', targetId)
        .eq('is_hidden', false)
        .single();

      if (!post) {
        return { success: false, message: 'Post not found' };
      }
    } else {
      const { data: comment } = await supabase
        .from('kcl_post_comments')
        .select('id')
        .eq('id', targetId)
        .eq('is_hidden', false)
        .single();

      if (!comment) {
        return { success: false, message: 'Comment not found' };
      }
    }

    // 신고 생성 (중복 검사는 RLS 또는 unique constraint로 처리)
    const { error: insertError } = await supabase.from('kcl_reports').insert({
      target_type: targetType,
      target_id: targetId,
      reason: reason?.trim() || null,
      // ip_hash는 서버에서만 설정 가능
    });

    if (insertError) {
      // 중복 신고일 수 있음
      if (insertError.code === '23505') {
        return { success: false, message: 'You have already reported this content' };
      }
      console.error('[submitReport] Failed to create report:', insertError.message);
      return { success: false, message: 'Failed to submit report' };
    }

    return {
      success: true,
      message: 'Report submitted successfully. Thank you for helping keep our community safe.',
    };
  } catch (error) {
    console.error('[submitReport] Unexpected error:', error);
    return { success: false, message: 'Failed to submit report' };
  }
}
