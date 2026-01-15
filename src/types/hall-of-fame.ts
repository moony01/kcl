/**
 * Hall of Fame 타입 정의
 *
 * KCL 명예의 전당 관련 데이터 타입을 정의합니다.
 * - 월간 챔피언 기록
 * - 연간 우승 횟수 집계
 * - 연간 대상 수상자
 */

/** 월간 챔피언 기록 */
export interface MonthlyChampion {
  year: number;
  month: number; // 1-12
  companyId: string;
  companyName: string;
  companyLogo: string;
  totalVotes: number;
  decidedAt: string; // ISO 8601
}

/** 연간 우승 횟수 집계 */
export interface YearlyWinCount {
  year: number;
  companyId: string;
  companyName: string;
  companyLogo: string;
  winCount: number;
  rank: number;
}

/** 연간 대상 수상자 (Grand Champion) */
export interface GrandChampion {
  year: number;
  companyId: string;
  companyName: string;
  companyLogo: string;
  winCount: number;
  totalVotesInYear: number;
  decidedAt: string; // ISO 8601
}

/** 명예의 전당 전체 데이터 */
export interface HallOfFameData {
  currentYear: number;
  latestGrandChampion: GrandChampion | null;
  currentYearRace: YearlyWinCount[];
  currentYearMonthly: MonthlyChampion[];
  archives: GrandChampion[];
}

/** 연도별 월간 챔피언 그룹 */
export interface YearlyChampions {
  year: number;
  champions: MonthlyChampion[];
}
