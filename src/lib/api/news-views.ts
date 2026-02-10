/**
 * KCL 뉴스 조회수 Supabase API 레이어
 * 클라이언트 사이드에서 뉴스 조회수 조회/증가 처리
 */

import { createClient } from '@/lib/supabase/client';

/** 뉴스 조회수 데이터 타입 */
export interface NewsViewCount {
  slug: string;
  view_count: number;
}

/**
 * 특정 뉴스의 조회수 조회
 * @param slug - 뉴스 식별자
 * @returns 조회수 (없으면 0)
 */
export async function getNewsViewCount(slug: string): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_news_views')
    .select('view_count')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.view_count;
}

/**
 * 여러 뉴스의 조회수 일괄 조회
 * @param slugs - 뉴스 slug 배열
 * @returns slug → view_count 맵
 */
export async function getNewsViewCounts(slugs: string[]): Promise<Record<string, number>> {
  if (slugs.length === 0) return {};

  const supabase = createClient();

  const { data, error } = await supabase
    .from('kcl_news_views')
    .select('slug, view_count')
    .in('slug', slugs);

  if (error || !data) {
    return {};
  }

  const map: Record<string, number> = {};
  for (const row of data) {
    map[row.slug] = row.view_count;
  }
  return map;
}

/**
 * 뉴스 조회수 증가 (fire-and-forget)
 * RPC 함수를 통해 UPSERT 처리
 * @param slug - 뉴스 식별자
 */
export async function incrementNewsView(slug: string): Promise<void> {
  const supabase = createClient();

  await supabase.rpc('increment_kcl_news_view', { p_slug: slug });
}
