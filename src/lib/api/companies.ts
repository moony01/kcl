/**
 * Companies API Layer
 *
 * 소속사 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/companies 대체
 *
 * 테이블: kcl_companies, kcl_groups
 */

import { getSupabase } from '@/lib/supabase/client';
import type { CompaniesResponse, DBLeagueTier, SubLabelData } from '@/types/api';

/**
 * 비동기 작업 타임아웃 유틸
 * Supabase 내부 lock 대기 등으로 Promise가 장시간 pending 되는 상황을 방지합니다.
 */
async function withTimeout<T>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`${label} timeout (${ms}ms)`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]);
}

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
  is_active: boolean;
  debut_date: string | null;
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
  league_tier: DBLeagueTier | null;
  /** T1.75: 산하 레이블의 부모 소속사 ID */
  parent_company_id: string | null;
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
    // T1.75: Supabase 쿼리 구성 (parent_company_id 포함)
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
        parent_company_id,
        groups:kcl_groups (
          id,
          name_ko,
          name_en,
          vote_count,
          is_active,
          debut_date
        )
      `,
      )
      .is('deleted_at', null)
      // 정렬: firepower 내림차순, 동점 시 전 시즌 순위 오름차순
      // 시즌 초기화 후에도 전 시즌 순위 순서가 유지됨
      .order('firepower', { ascending: false })
      .order('previous_season_rank', { ascending: true });

    const { data: rawCompanies, error } = await withTimeout(
      query,
      10000,
      'getCompanies query',
    );

    if (error) {
      console.error('[Companies API] Supabase error:', error.message);
      throw error;
    }

    const allCompanies = (rawCompanies || []) as CompanyData[];

    // T1.75: 부모 소속사와 서브레이블 분리
    const parentCompanies = allCompanies.filter((c) => c.parent_company_id === null);
    const subLabelCompanies = allCompanies.filter((c) => c.parent_company_id !== null);

    // T1.75: 서브레이블 그룹을 부모 소속사에 병합 + sub_labels 배열 생성
    // HYBE 아티스트 0명 문제 해결: 서브레이블의 그룹을 부모에 합산
    const subLabelsByParent = new Map<string, CompanyData[]>();
    for (const sub of subLabelCompanies) {
      const parentId = sub.parent_company_id!;
      if (!subLabelsByParent.has(parentId)) {
        subLabelsByParent.set(parentId, []);
      }
      subLabelsByParent.get(parentId)!.push(sub);
    }

    // 데이터 변환: rank 동적 계산, 그룹 정렬, 서브레이블 병합
    // league_tier === null인 서브레이블은 최종 결과에서 제외 (부모에만 tier 설정됨)
    const transformedCompanies = parentCompanies
      .filter((company) => company.league_tier !== null)
      .map((company, index) => {
        // 부모 소속사 자체 그룹 (비활성 아티스트 제외)
        const ownGroups = (Array.isArray(company.groups) ? company.groups : [])
          .filter((g) => g.is_active !== false);

        // T1.75: 서브레이블의 그룹도 부모에 합산 (비활성 아티스트 제외)
        const subs = subLabelsByParent.get(company.id) || [];
        const subLabelGroups = subs.flatMap((sub) =>
          (Array.isArray(sub.groups) ? sub.groups : []).filter((g) => g.is_active !== false),
        );
        const allGroups = [...ownGroups, ...subLabelGroups];

        // 그룹을 debut_date 기준 신인순 정렬 (최근 데뷔가 위로)
        // debut_date가 없으면 맨 뒤로
        const sortedGroups = [...allGroups].sort((a, b) => {
          const dateA = a.debut_date ? new Date(a.debut_date).getTime() : 0;
          const dateB = b.debut_date ? new Date(b.debut_date).getTime() : 0;
          return dateB - dateA;
        });

        // T1.75: sub_labels 배열 생성 (서브레이블이 있는 경우만)
        const subLabels: SubLabelData[] | undefined =
          subs.length > 0
            ? subs.map((sub) => ({
                id: sub.id,
                name_ko: sub.name_ko,
                name_en: sub.name_en,
                groups: Array.isArray(sub.groups)
                  ? [...sub.groups]
                      .filter((g) => g.is_active !== false)
                      .sort((a, b) => {
                        const dateA = a.debut_date ? new Date(a.debut_date).getTime() : 0;
                        const dateB = b.debut_date ? new Date(b.debut_date).getTime() : 0;
                        return dateB - dateA;
                      })
                  : [],
              }))
            : undefined;

        return {
          id: company.id,
          name_ko: company.name_ko,
          name_en: company.name_en,
          slug: company.slug,
          logo_url: company.logo_url,
          gradient_color: company.gradient_color,
          firepower: company.firepower,
          league_tier: company.league_tier as DBLeagueTier,
          rank: index + 1, // firepower 순위 (1부터)
          groups: sortedGroups,
          ...(subLabels && { sub_labels: subLabels }),
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
