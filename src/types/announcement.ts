/**
 * MEARROW 공지사항 타입 정의
 * Supabase announcements 테이블과 매핑
 */

/** 공지사항 카테고리 */
export type AnnouncementCategory = 'notice' | 'update' | 'event';

/** 공지사항 DB 레코드 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  is_pinned: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/** 공지사항 목록 조회용 (content 제외) */
export type AnnouncementListItem = Omit<Announcement, 'content'>;
