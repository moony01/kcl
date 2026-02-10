/**
 * KCL 공지사항 Supabase API 레이어
 * 클라이언트 사이드에서 Supabase를 통해 공지사항 데이터 조회
 * 빌드 타임에서는 서버 클라이언트를 통해 정적 페이지 생성용 데이터 조회
 */

import { createClient } from '@/lib/supabase/client';
import type { Announcement, AnnouncementCategory, AnnouncementListItem } from '@/types/announcement';

/** 공지사항 목록 조회 (공개된 것만, RLS 적용) */
export async function getAnnouncements(category?: AnnouncementCategory): Promise<AnnouncementListItem[]> {
  const supabase = createClient();

  let query = supabase
    .from('kcl_announcements')
    .select('id, title, category, is_pinned, is_published, view_count, created_at, updated_at')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[announcements] 목록 조회 실패:', error);
    throw error;
  }

  return data || [];
}

/** 공지사항 상세 조회 */
export async function getAnnouncementById(id: string): Promise<Announcement | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_announcements')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();

  if (error) {
    console.error('[announcements] 상세 조회 실패:', error);
    return null;
  }

  return data;
}

/** 조회수 증가 */
export async function incrementAnnouncementView(id: string): Promise<void> {
  const supabase = createClient();

  await supabase.rpc('increment_kcl_announcement_view', { p_id: id });
}

/**
 * 공개된 공지사항 ID 전체 조회 (빌드 타임 전용)
 * generateStaticParams()에서 사용하여 정적 페이지 생성
 * 서버 환경에서만 호출됨 (createServerClient 사용)
 */
export async function getPublishedAnnouncementIds(): Promise<string[]> {
  const { createServerClient } = await import('@/lib/supabase/server');
  const supabase = createServerClient();

  if (!supabase) {
    console.warn('[announcements] 서버 클라이언트 생성 실패, 빈 배열 반환');
    return [];
  }

  const { data, error } = await supabase
    .from('kcl_announcements')
    .select('id')
    .eq('is_published', true);

  if (error) {
    console.error('[announcements] ID 목록 조회 실패:', error);
    return [];
  }

  return (data || []).map((row: { id: string }) => row.id);
}
