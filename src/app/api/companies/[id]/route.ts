/**
 * Company Detail API Route
 *
 * 개별 소속사 상세 정보 조회 엔드포인트
 * - GET: 소속사 상세 정보 + 소속 그룹 목록
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import { createServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 소속사 상세 정보 조회
 *
 * @param id - 소속사 UUID 또는 slug
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client not available' }, { status: 503 });
    }

    // UUID 형식인지 slug인지 판단
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 소속사 정보 조회
    let companyQuery = supabase.from('kcl_companies').select(`
        id,
        name_ko,
        name_en,
        slug,
        logo_url,
        description,
        gradient_color,
        rank,
        firepower,
        created_at
      `);

    if (isUUID) {
      companyQuery = companyQuery.eq('id', id);
    } else {
      companyQuery = companyQuery.eq('slug', id);
    }

    const { data: company, error: companyError } = await companyQuery.single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // 소속 그룹 목록 조회
    const { data: groups, error: groupsError } = await supabase
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
      .eq('company_id', company.id)
      .eq('is_active', true)
      .order('name_en');

    if (groupsError) {
      console.error('[Company Detail API] Groups fetch error:', groupsError.message);
    }

    return NextResponse.json({
      company,
      groups: groups || [],
      groupCount: groups?.length || 0,
    });
  } catch (error) {
    console.error('[Company Detail API] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
