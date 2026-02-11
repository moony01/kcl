/**
 * API 응답 타입 정의
 *
 * Supabase 테이블 스키마와 매핑되는 타입들입니다.
 */

/** 리그 구분 타입 (DB 컬럼 값) */
export type DBLeagueTier = 'premier' | 'challengers';

/** Supabase kcl_companies 테이블 스키마 */
export interface DBCompany {
  id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  gradient_color: string | null;
  rank: number;
  firepower: number;
  /** T1.53: 리그 티어 (시즌 중 고정, 월초 승강) */
  league_tier: DBLeagueTier;
  /** T1.75: 산하 레이블의 부모 소속사 ID (null이면 최상위 소속사) */
  parent_company_id: string | null;
  created_at: string;
  updated_at: string;
}

/** T1.75: 산하 레이블 데이터 (API 응답용) */
export interface SubLabelData {
  id: string;
  name_ko: string;
  name_en: string;
  groups: Pick<DBGroup, 'id' | 'name_ko' | 'name_en' | 'vote_count'>[];
}

/** Supabase kcl_groups 테이블 스키마 */
export interface DBGroup {
  id: string;
  company_id: string;
  name_ko: string;
  name_en: string;
  slug: string;
  debut_date: string | null;
  member_count: number | null;
  group_type: 'boy' | 'girl' | 'solo' | 'co-ed' | null;
  is_active: boolean;
  vote_count: number; // T1.21 추가: 그룹별 투표 수
  created_at: string;
  updated_at: string;
}

/** API 응답: 소속사 목록 */
export interface CompaniesResponse {
  companies: (Pick<
    DBCompany,
    | 'id'
    | 'name_ko'
    | 'name_en'
    | 'slug'
    | 'logo_url'
    | 'gradient_color'
    | 'rank'
    | 'firepower'
    | 'league_tier'
  > & {
    groups: Pick<DBGroup, 'id' | 'name_ko' | 'name_en' | 'vote_count'>[];
    /** T1.75: 산하 레이블 목록 (HYBE, YG 등 산하가 있는 소속사만) */
    sub_labels?: SubLabelData[];
  })[];
  totalCount: number;
  updatedAt: string;
}

/** API 응답: 소속사 상세 */
export interface CompanyDetailResponse {
  company: Omit<DBCompany, 'updated_at'>;
  groups: Pick<
    DBGroup,
    | 'id'
    | 'name_ko'
    | 'name_en'
    | 'slug'
    | 'debut_date'
    | 'member_count'
    | 'group_type'
    | 'is_active'
  >[];
  groupCount: number;
}

/** API 응답: 그룹 목록 */
export interface GroupsResponse {
  groups: Pick<
    DBGroup,
    | 'id'
    | 'name_ko'
    | 'name_en'
    | 'slug'
    | 'debut_date'
    | 'member_count'
    | 'group_type'
    | 'is_active'
  >[];
  totalCount: number;
  companyId: string;
}

/** API 에러 응답 */
export interface APIErrorResponse {
  error: string;
}
