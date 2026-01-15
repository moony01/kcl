/**
 * Community Types
 *
 * 자유게시판 관련 타입 정의
 * Supabase kcl_posts, kcl_post_comments, kcl_reports 테이블과 매핑
 */

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

/** API 응답: 게시글 (공개 필드만) */
export interface Post {
  id: string;
  nickname: string;
  title: string;
  content: string;
  view_count: number;
  comment_count: number;
  created_at: string;
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

/** API 요청: 게시글 작성 */
export interface CreatePostRequest {
  nickname: string;
  title: string;
  content: string;
}

/** API 요청: 댓글 작성 */
export interface CreateCommentRequest {
  nickname: string;
  content: string;
}

/** API 요청: 신고 */
export interface CreateReportRequest {
  target_type: 'post' | 'comment';
  target_id: string;
  reason?: string;
}

/** API 응답: 게시글 목록 */
export interface PostsResponse {
  posts: PostListItem[];
  totalCount: number;
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
