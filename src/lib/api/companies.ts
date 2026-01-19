/**
 * Companies API Layer
 *
 * 소속사 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/companies 대체
 *
 * 테이블: kcl_companies, kcl_groups
 */

import { getSupabase } from '@/lib/supabase/client';
import type { CompaniesResponse, DBLeagueTier } from '@/types/api';

/** 소속사 목록 조회 옵션 */
export interface GetCompaniesOptions {
  /** 리그 필터 ('premier' | 'challengers') */
  tier?: DBLeagueTier;
  /** 최대 개수 */
  limit?: number;
}

/** 그룹 정보 타입 (Supabase 응답) */
interface GroupData {
  id: string;
  name_ko: string;
  name_en: string;
  vote_count: number;
}

/** 소속사 정보 타입 (Supabase 응답) */
interface CompanyData {
  id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  logo_url: string | null;
  gradient_color: string | null;
  rank: number;
  firepower: number;
  league_tier: DBLeagueTier;
  groups: GroupData[];
}

/**
 * 소속사 목록 조회 (Supabase 직접 호출)
 *
 * 기존 /api/companies의 로직을 클라이언트에서 직접 실행합니다.
 *
 * @param options - 조회 옵션
 * @returns 소속사 목록 및 메타 정보
 *
 * @example
 * ```typescript
 * // 전체 목록
 * const data = await getCompanies();
 *
 * // 1부 리그만
 * const premier = await getCompanies({ tier: 'premier' });
 *
 * // 상위 5개
 * const top5 = await getCompanies({ limit: 5 });
 * ```
 */
export async function getCompanies(
  options: GetCompaniesOptions = {},
): Promise<CompaniesResponse & { source: 'db' | 'error' }> {
  const { tier, limit } = options;
  const supabase = getSupabase();

  try {
    // Supabase 쿼리 구성
    const query = supabase
      .from('kcl_companies')
      .select(
        `
        id,
        name_ko,
        name_en,
        slug,
        logo_url,
        gradient_color,
        rank,
        firepower,
        league_tier,
        groups:kcl_groups (
          id,
          name_ko,
          name_en,
          vote_count
        )
      `,
      )
      .order('firepower', { ascending: false })
      .order('id', { ascending: true });

    const { data: rawCompanies, error } = await query;

    if (error) {
      console.error('[Companies API] Supabase error:', error.message);
      throw error;
    }

    // 전체 회사를 firepower 순으로 정렬 후 순위 부여
    const allCompanies = (rawCompanies || []) as CompanyData[];

    // 데이터 변환: rank 동적 계산 및 그룹 정렬
    const transformedCompanies = allCompanies.map((company, index) => {
      // 그룹을 vote_count 기준 정렬 후 상위 4개만
      const sortedGroups = Array.isArray(company.groups)
        ? [...company.groups].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)).slice(0, 4)
        : [];

      return {
        id: company.id,
        name_ko: company.name_ko,
        name_en: company.name_en,
        slug: company.slug,
        logo_url: company.logo_url,
        gradient_color: company.gradient_color,
        firepower: company.firepower,
        league_tier: company.league_tier,
        rank: index + 1, // firepower 순위 (1부터)
        groups: sortedGroups,
      };
    });

    // 리그 필터 적용
    let companies = transformedCompanies;
    if (tier) {
      companies = companies.filter((c) => c.league_tier === tier);
    }

    // 개수 제한 적용
    if (limit && limit > 0) {
      companies = companies.slice(0, limit);
    }

    return {
      companies,
      totalCount: companies.length,
      updatedAt: new Date().toISOString(),
      source: 'db',
    };
  } catch (error) {
    console.error('[getCompanies] Error:', error);
    // 에러 시 빈 데이터 반환 (UI에서 처리)
    return {
      companies: [],
      totalCount: 0,
      updatedAt: new Date().toISOString(),
      source: 'error',
    };
  }
}

/** 소속사 상세 정보 타입 */
export interface CompanyDetail {
  id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  gradient_color: string | null;
  rank: number;
  firepower: number;
  created_at: string;
}

/** 그룹 상세 정보 타입 */
export interface GroupDetail {
  id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  debut_date: string | null;
  member_count: number | null;
  group_type: 'boy' | 'girl' | 'solo' | 'co-ed' | null;
  is_active: boolean;
}

/** 소속사 상세 응답 타입 */
export interface CompanyDetailResult {
  company: CompanyDetail | null;
  groups: GroupDetail[];
  groupCount: number;
  error?: string;
}

/**
 * 소속사 상세 정보 조회
 *
 * @param companyIdOrSlug - 소속사 UUID 또는 slug
 * @returns 소속사 상세 정보 및 소속 그룹 목록
 */
export async function getCompanyById(companyIdOrSlug: string): Promise<CompanyDetailResult> {
  const supabase = getSupabase();

  try {
    // UUID 형식인지 slug인지 판단
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      companyIdOrSlug,
    );

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
      companyQuery = companyQuery.eq('id', companyIdOrSlug);
    } else {
      companyQuery = companyQuery.eq('slug', companyIdOrSlug);
    }

    const { data: company, error: companyError } = await companyQuery.single();

    if (companyError || !company) {
      return {
        company: null,
        groups: [],
        groupCount: 0,
        error: 'Company not found',
      };
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
      console.error('[getCompanyById] Groups fetch error:', groupsError.message);
    }

    return {
      company: company as CompanyDetail,
      groups: (groups as GroupDetail[]) || [],
      groupCount: groups?.length || 0,
    };
  } catch (error) {
    console.error('[getCompanyById] Error:', error);
    return {
      company: null,
      groups: [],
      groupCount: 0,
      error: 'Failed to fetch company',
    };
  }
}

/** 그룹 목록 조회 옵션 */
export interface GetCompanyGroupsOptions {
  /** 활동 중인 그룹만 조회 (기본: true) */
  activeOnly?: boolean;
  /** 그룹 타입 필터 */
  groupType?: 'boy' | 'girl' | 'solo' | 'co-ed';
}

/** 그룹 목록 응답 */
export interface CompanyGroupsResult {
  groups: GroupDetail[];
  totalCount: number;
  companyId: string;
  error?: string;
}

/**
 * 소속사별 그룹 목록 조회
 *
 * @param companyIdOrSlug - 소속사 UUID 또는 slug
 * @param options - 조회 옵션
 * @returns 그룹 목록
 */
export async function getCompanyGroups(
  companyIdOrSlug: string,
  options: GetCompanyGroupsOptions = {},
): Promise<CompanyGroupsResult> {
  const { activeOnly = true, groupType } = options;
  const supabase = getSupabase();

  try {
    // UUID 형식인지 slug인지 판단
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      companyIdOrSlug,
    );

    // 소속사 ID 조회 (slug인 경우)
    let companyId = companyIdOrSlug;
    if (!isUUID) {
      const { data: company, error: companyError } = await supabase
        .from('kcl_companies')
        .select('id')
        .eq('slug', companyIdOrSlug)
        .single();

      if (companyError || !company) {
        return {
          groups: [],
          totalCount: 0,
          companyId: '',
          error: 'Company not found',
        };
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
      console.error('[getCompanyGroups] Supabase error:', error.message);
      throw error;
    }

    return {
      groups: (groups as GroupDetail[]) || [],
      totalCount: groups?.length || 0,
      companyId,
    };
  } catch (error) {
    console.error('[getCompanyGroups] Error:', error);
    return {
      groups: [],
      totalCount: 0,
      companyId: companyIdOrSlug,
      error: 'Failed to fetch groups',
    };
  }
}
