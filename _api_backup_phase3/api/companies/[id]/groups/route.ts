/**
 * Company Groups API Route
 *
 * 소속사별 그룹(아티스트) 목록 조회 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 소속사별 그룹 목록 조회
 *
 * @param id - 소속사 UUID 또는 slug
 *
 * Query Parameters:
 * - active_only: boolean (기본 true, 활동 중인 그룹만)
 * - group_type: 'boy' | 'girl' | 'solo' | 'co-ed' (선택)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 503 });
    }

    // Query Parameters 파싱
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') !== 'false';
    const groupType = searchParams.get('group_type');

    // UUID 형식인지 slug인지 판단
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 소속사 ID 조회 (slug인 경우)
    let companyId = id;
    if (!isUUID) {
      const { data: company, error: companyError } = await supabase
        .from('kcl_companies')
        .select('id')
        .eq('slug', id)
        .single();

      if (companyError || !company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      companyId = company.id;
    }

    // 그룹 목록 쿼리
    let query = supabase
      .from('kcl_groups')
      .select(
        `
        id,
        name_ko,
        name_en,
        slug,
        debut_date,
        member_count,
        group_type,
        is_active
      `,
      )
      .eq('company_id', companyId)
      .order('name_en');

    // 활동 중 필터
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // 그룹 타입 필터
    if (groupType && ['boy', 'girl', 'solo', 'co-ed'].includes(groupType)) {
      query = query.eq('group_type', groupType);
    }

    const { data: groups, error } = await query;

    if (error) {
      console.error('[Company Groups API] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }

    return NextResponse.json({
      groups: groups || [],
      totalCount: groups?.length || 0,
      companyId,
    });
  } catch (error) {
    console.error('[Company Groups API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
