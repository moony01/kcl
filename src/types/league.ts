/**
 * League 시스템 타입 정의
 *
 * KCL 리그 시스템에서 사용되는 타입들을 정의합니다.
 * - 1부 리그 (Premier League): 1~10위
 * - 2부 리그 (Challengers): 11위~
 *
 * 승강 규칙 (2026년 개편):
 * - 1부 10위: 강등 직행 → 무조건 2부로 강등
 * - 1부 9위: 강등 위기 → 2부 2위와 대결, 지면 강등
 * - 2부 1위: 승격 직행 → 무조건 1부로 승격
 * - 2부 2위: 승격 기회 → 1부 9위와 대결, 이기면 승격
 */

/** 리그 구분 */
export type LeagueTier = 'premier' | 'challengers';

/**
 * 승강 상태 타입
 *
 * 각 소속사의 승강 관련 상태를 나타냅니다.
 * - relegation_direct: 1부 10위 (강등 직행, 빨간색)
 * - relegation_danger: 1부 9위 (강등 위기, 오렌지색)
 * - promotion_direct: 2부 1위 (승격 직행, 초록색)
 * - promotion_chance: 2부 2위 (승격 기회, 골드색)
 * - safe: 그 외 안전 지대
 */
export type PromotionStatus =
  | 'relegation_direct'
  | 'relegation_danger'
  | 'promotion_direct'
  | 'promotion_chance'
  | 'safe';

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

/** T1.75: 산하 레이블 정보 (UI용) */
export interface SubLabelInfo {
  id: string;
  nameEn: string;
  nameKo: string;
  /** 해당 서브레이블 소속 아티스트 */
  artists: {
    en: string[];
    ko: string[];
  };
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
  isRelegationZone: boolean; // 10위 (강등 위기) - deprecated, use promotionStatus
  isPromotionZone: boolean; // 11위 (승격 기회) - deprecated, use promotionStatus

  /** 승강 상태 (2026년 개편) */
  promotionStatus: PromotionStatus;

  /** 대표 아티스트 목록 */
  artists: {
    en: string[];
    ko: string[];
  };

  /** T1.75: 산하 레이블 목록 (없으면 undefined) */
  subLabels?: SubLabelInfo[];
}

/** 승강전 정보 (직행 승강전: 10위 vs 1위) */
export interface PromotionBattle {
  relegationCompany: CompanyRanking; // 1부 10위 (강등 직행)
  promotionCompany: CompanyRanking; // 2부 1위 (승격 직행)
  gap: number; // 투표 수 격차
}

/**
 * 플레이오프 정보 (조건부 승강전: 9위 vs 2위)
 *
 * 2부 2위가 1부 9위보다 화력이 높으면 교체
 */
export interface PlayoffBattle {
  /** 1부 9위 (강등 위기) */
  dangerCompany: CompanyRanking;
  /** 2부 2위 (승격 기회) */
  chanceCompany: CompanyRanking;
  /** 투표 수 격차 (양수: 9위 우세, 음수: 2위 우세) */
  gap: number;
  /** 2부 2위가 현재 이기고 있는지 여부 */
  isChanceWinning: boolean;
}

/**
 * 전체 승강전 정보
 *
 * 직행 승강전과 플레이오프를 모두 포함
 */
export interface PromotionBattles {
  /** 직행 승강전: 1부 10위 vs 2부 1위 */
  direct: PromotionBattle;
  /** 플레이오프: 1부 9위 vs 2부 2위 */
  playoff: PlayoffBattle;
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
