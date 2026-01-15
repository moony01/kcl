/**
 * Community Types
 *
 * 자유게시판 관련 타입 정의
 * Supabase kcl_posts, kcl_post_comments, kcl_reports 테이블과 매핑
 */

// ============================================
// Database Schema Types (Supabase 테이블 매핑)
// ============================================

/** Supabase kcl_posts 테이블 스키마 */
export interface DBPost {
  id: string;
  nickname: string;
  title: string;
  content: string;
  ip_hash: string;
  view_count: number;
  comment_count: number;
  is_hidden: boolean;
  created_at: string;
}

/** Supabase kcl_post_comments 테이블 스키마 */
export interface DBPostComment {
  id: string;
  post_id: string;
  nickname: string;
  content: string;
  ip_hash: string;
  is_hidden: boolean;
  created_at: string;
}

/** Supabase kcl_reports 테이블 스키마 */
export interface DBReport {
  id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reason: string | null;
  ip_hash: string;
  created_at: string;
}

// ============================================
// API Response Types (공개 필드만)
// ============================================

/** API 응답: 게시글 (공개 필드만) */
export interface Post {
  id: string;
  nickname: string;
  title: string;
  content: string;
  view_count: number;
  comment_count: number;
  created_at: string;
  updated_at?: string;
}

/** API 응답: 게시글 목록 아이템 (content 제외) */
export interface PostListItem {
  id: string;
  nickname: string;
  title: string;
  view_count: number;
  comment_count: number;
  created_at: string;
}

/** API 응답: 댓글 (공개 필드만) */
export interface PostComment {
  id: string;
  post_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

/** Comment 타입 별칭 (프론트엔드 호환용) */
export type Comment = PostComment;

/** 신고 타입 */
export interface Report {
  id: string;
  target_type: 'post' | 'comment';
  target_id: string;
  reason: ReportReason;
  detail?: string;
  created_at: string;
}

/** 신고 사유 타입 */
export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'other';

// ============================================
// API Request Types (요청 데이터)
// ============================================

/** API 요청: 게시글 작성 */
export interface CreatePostRequest {
  nickname: string;
  title: string;
  content: string;
}

/** 게시글 작성 폼 데이터 (프론트엔드 호환용) */
export type PostFormData = CreatePostRequest;

/** API 요청: 댓글 작성 */
export interface CreateCommentRequest {
  nickname: string;
  content: string;
}

/** 댓글 작성 폼 데이터 (프론트엔드 호환용) */
export type CommentFormData = CreateCommentRequest;

/** API 요청: 신고 */
export interface CreateReportRequest {
  target_type: 'post' | 'comment';
  target_id: string;
  reason?: string;
}

/** 신고 폼 데이터 */
export interface ReportFormData {
  reason: ReportReason;
  detail?: string;
}

// ============================================
// API Response Types (응답 구조)
// ============================================

/** API 응답: 게시글 목록 */
export interface PostsResponse {
  posts: PostListItem[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** 페이지네이션 응답 (제네릭) */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** API 응답: 게시글 상세 */
export interface PostDetailResponse {
  post: Post;
  comments: PostComment[];
}

/** API 응답: 공통 성공/실패 */
export interface CommunityAPIResponse {
  success: boolean;
  message?: string;
}

/** API 응답: 게시글 작성 성공 */
export interface CreatePostResponse extends CommunityAPIResponse {
  post?: Post;
}

/** API 응답: 댓글 작성 성공 */
export interface CreateCommentResponse extends CommunityAPIResponse {
  comment?: PostComment;
}
