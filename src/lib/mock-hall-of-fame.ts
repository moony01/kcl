/**
 * Hall of Fame Mock 데이터
 *
 * 명예의 전당 테스트 및 개발용 Mock 데이터입니다.
 * 실제 DB 연동 전까지 이 데이터를 사용합니다.
 */

import type {
  MonthlyChampion,
  YearlyWinCount,
  GrandChampion,
  HallOfFameData,
} from '@/types/hall-of-fame';

/** 소속사 정보 (Mock) */
const COMPANIES = {
  hybe: {
    id: 'co-hybe',
    name: 'HYBE',
    logo: 'linear-gradient(135deg, #E1D91A 0%, #1A1A1A 100%)',
  },
  sm: {
    id: 'co-sm',
    name: 'SM Entertainment',
    logo: 'linear-gradient(135deg, #FF66A0 0%, #FF2E74 100%)',
  },
  jyp: {
    id: 'co-jyp',
    name: 'JYP Entertainment',
    logo: 'linear-gradient(135deg, #00B9F1 0%, #004F9F 100%)',
  },
  yg: {
    id: 'co-yg',
    name: 'YG Entertainment',
    logo: 'linear-gradient(135deg, #000000 0%, #444444 100%)',
  },
  starship: {
    id: 'co-starship',
    name: 'Starship Ent.',
    logo: 'linear-gradient(135deg, #9C27B0 0%, #673AB7 100%)',
  },
  cube: {
    id: 'co-cube',
    name: 'Cube Ent.',
    logo: 'linear-gradient(135deg, #1CB5E0 0%, #000851 100%)',
  },
};

/** 2025년 월간 챔피언 기록 */
const MONTHLY_CHAMPIONS_2025: MonthlyChampion[] = [
  {
    year: 2025,
    month: 1,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 15420300,
    decidedAt: '2025-02-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 2,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    totalVotes: 12850100,
    decidedAt: '2025-03-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 3,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 16200500,
    decidedAt: '2025-04-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 4,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 14800200,
    decidedAt: '2025-05-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 5,
    companyId: COMPANIES.jyp.id,
    companyName: COMPANIES.jyp.name,
    companyLogo: COMPANIES.jyp.logo,
    totalVotes: 11020500,
    decidedAt: '2025-06-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 6,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    totalVotes: 13500100,
    decidedAt: '2025-07-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 7,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 17100300,
    decidedAt: '2025-08-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 8,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    totalVotes: 12200400,
    decidedAt: '2025-09-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 9,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 15800200,
    decidedAt: '2025-10-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 10,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    totalVotes: 11900500,
    decidedAt: '2025-11-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 11,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 16500100,
    decidedAt: '2025-12-01T00:00:00Z',
  },
  {
    year: 2025,
    month: 12,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    totalVotes: 14100200,
    decidedAt: '2026-01-01T00:00:00Z',
  },
];

/** 2026년 월간 챔피언 기록 (현재 진행 중) */
const MONTHLY_CHAMPIONS_2026: MonthlyChampion[] = [
  {
    year: 2026,
    month: 1,
    companyId: COMPANIES.hybe.id,
    companyName: COMPANIES.hybe.name,
    companyLogo: COMPANIES.hybe.logo,
    totalVotes: 18200300,
    decidedAt: '2026-02-01T00:00:00Z',
  },
];

/** 2025년 대상 수상자 */
const GRAND_CHAMPION_2025: GrandChampion = {
  year: 2025,
  companyId: COMPANIES.hybe.id,
  companyName: COMPANIES.hybe.name,
  companyLogo: COMPANIES.hybe.logo,
  winCount: 6, // 1,3,4,7,9,11월 우승
  totalVotesInYear: 95821100,
  decidedAt: '2026-01-01T00:00:00Z',
};

/** 역대 대상 수상자 (Archive) */
const ARCHIVES: GrandChampion[] = [
  GRAND_CHAMPION_2025,
  {
    year: 2024,
    companyId: COMPANIES.sm.id,
    companyName: COMPANIES.sm.name,
    companyLogo: COMPANIES.sm.logo,
    winCount: 7,
    totalVotesInYear: 88500200,
    decidedAt: '2025-01-01T00:00:00Z',
  },
  {
    year: 2023,
    companyId: COMPANIES.yg.id,
    companyName: COMPANIES.yg.name,
    companyLogo: COMPANIES.yg.logo,
    winCount: 5,
    totalVotesInYear: 72100500,
    decidedAt: '2024-01-01T00:00:00Z',
  },
];

/**
 * 연간 우승 횟수 계산
 * @param champions 월간 챔피언 목록
 * @returns 우승 횟수 순위
 */
function calculateYearlyRace(champions: MonthlyChampion[]): YearlyWinCount[] {
  const countMap = new Map<string, YearlyWinCount>();

  for (const champion of champions) {
    const existing = countMap.get(champion.companyId);
    if (existing) {
      existing.winCount += 1;
    } else {
      countMap.set(champion.companyId, {
        year: champion.year,
        companyId: champion.companyId,
        companyName: champion.companyName,
        companyLogo: champion.companyLogo,
        winCount: 1,
        rank: 0,
      });
    }
  }

  // 순위 계산 (우승 횟수 내림차순)
  const sorted = Array.from(countMap.values()).sort((a, b) => b.winCount - a.winCount);
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  return sorted;
}

/**
 * Mock Hall of Fame 데이터 반환
 */
export function getMockHallOfFameData(): HallOfFameData {
  const currentYear = 2026;

  return {
    currentYear,
    latestGrandChampion: GRAND_CHAMPION_2025,
    currentYearRace: calculateYearlyRace(MONTHLY_CHAMPIONS_2026),
    currentYearMonthly: MONTHLY_CHAMPIONS_2026,
    archives: ARCHIVES,
  };
}

/**
 * 특정 연도의 월간 챔피언 데이터 반환
 */
export function getMockMonthlyChampions(year: number): MonthlyChampion[] {
  if (year === 2025) return MONTHLY_CHAMPIONS_2025;
  if (year === 2026) return MONTHLY_CHAMPIONS_2026;
  return [];
}

/**
 * 특정 연도의 경쟁 현황 반환
 */
export function getMockYearlyRace(year: number): YearlyWinCount[] {
  const champions = getMockMonthlyChampions(year);
  return calculateYearlyRace(champions);
}

/** 전체 월간 챔피언 (2025 + 2026) */
export const MOCK_ALL_CHAMPIONS = [...MONTHLY_CHAMPIONS_2025, ...MONTHLY_CHAMPIONS_2026];

/** 역대 대상 수상자 export */
export const MOCK_ARCHIVES = ARCHIVES;
