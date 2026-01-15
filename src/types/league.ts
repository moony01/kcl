/**
 * League 시스템 타입 정의
 *
 * KCL 리그 시스템에서 사용되는 타입들을 정의합니다.
 * - 1부 리그 (Premier League): 1~10위
 * - 2부 리그 (Challengers): 11위~
 * - 승강전: 10위 vs 11위
 */

/** 리그 구분 */
export type LeagueTier = 'premier' | 'challengers';

/** 탭 타입 (UI용) */
export type LeagueTabType = 'premier' | 'challengers';

/** 시즌 정보 */
export interface SeasonInfo {
  year: number;
  month: number;
  startDate: string; // ISO 8601
  endDate: string;
  daysRemaining: number;
  isActive: boolean;
}

/** 소속사 순위 정보 */
export interface CompanyRanking {
  companyId: string;
  companyName: string;
  nameKo: string;
  nameEn: string;
  logoUrl: string;
  gradientColor: string;

  rank: number;
  previousRank: number;
  rankChange: number; // +면 상승, -면 하락

  voteCount: number;
  voteCountHourly: number; // 최근 1시간 득표

  tier: LeagueTier;
  isRelegationZone: boolean; // 10위 (강등 위기)
  isPromotionZone: boolean; // 11위 (승격 기회)

  /** 대표 아티스트 목록 */
  artists: {
    en: string[];
    ko: string[];
  };
}

/** 승강전 정보 */
export interface PromotionBattle {
  relegationCompany: CompanyRanking; // 10위
  promotionCompany: CompanyRanking; // 11위
  gap: number; // 투표 수 격차
}

/** 리그 전체 데이터 */
export interface LeagueData {
  season: SeasonInfo;
  premierLeague: CompanyRanking[]; // 1-10위
  challengers: CompanyRanking[]; // 11위~
  promotionBattle: PromotionBattle;
  totalCompanies: number;
  updatedAt: string;
}
