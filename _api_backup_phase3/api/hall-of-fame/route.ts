/**
 * Hall of Fame API Route
 *
 * 명예의 전당 데이터 조회 엔드포인트
 * - GET: 전체 명예의 전당 데이터 반환
 *
 * T1.58: kcl_seasons 테이블 기반 실제 DB 데이터 조회
 * - 현재 연도 월간 챔피언 목록
 * - 연도별 우승 횟수 집계 (대상 경쟁 현황)
 * - 역대 대상 수상자 (직전 연도들의 최다 우승 회사)
 *
 * 응답 구조: HallOfFameData (types/hall-of-fame.ts 참조)
 * Fallback: Supabase 연결 실패 시 Mock 데이터 반환
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getMockHallOfFameData } from '@/lib/mock-hall-of-fame';
import type {
  HallOfFameData,
  MonthlyChampion,
  YearlyWinCount,
  GrandChampion,
} from '@/types/hall-of-fame';

/** DB 레코드 타입 */
interface SeasonRecord {
  id: string;
  year: number;
  month: number;
  champion_company_id: string;
  total_votes: number;
  decided_at: string;
  company: {
    id: string;
    name_ko: string;
    name_en: string;
    logo_url: string | null;
    gradient_color: string | null;
  } | null;
}

/**
 * 시즌 레코드를 MonthlyChampion으로 변환
 */
function toMonthlyChampion(record: SeasonRecord): MonthlyChampion {
  return {
    year: record.year,
    month: record.month,
    companyId: record.champion_company_id,
    companyName: record.company?.name_en || 'Unknown',
    companyLogo: record.company?.gradient_color || '#8B5CF6',
    totalVotes: record.total_votes,
    decidedAt: record.decided_at,
  };
}

/**
 * 월간 챔피언 목록에서 연간 우승 횟수 집계
 */
function calculateYearlyWinCount(champions: MonthlyChampion[], year: number): YearlyWinCount[] {
  const yearChampions = champions.filter((c) => c.year === year);
  const countMap = new Map<string, YearlyWinCount>();

  for (const champion of yearChampions) {
    const existing = countMap.get(champion.companyId);
    if (existing) {
      existing.winCount += 1;
    } else {
      countMap.set(champion.companyId, {
        year,
        companyId: champion.companyId,
        companyName: champion.companyName,
        companyLogo: champion.companyLogo,
        winCount: 1,
        rank: 0,
      });
    }
  }

  // 우승 횟수 기준 내림차순 정렬 후 순위 부여
  const sorted = Array.from(countMap.values()).sort((a, b) => b.winCount - a.winCount);
  sorted.forEach((item, index) => {
    item.rank = index + 1;
  });

  return sorted;
}

/**
 * 특정 연도의 대상 수상자 결정
 * - 해당 연도에서 가장 많이 우승한 회사
 * - 동점 시: 총 투표수가 많은 회사
 */
function determineGrandChampion(champions: MonthlyChampion[], year: number): GrandChampion | null {
  const yearChampions = champions.filter((c) => c.year === year);
  if (yearChampions.length === 0) return null;

  // 회사별 우승 횟수 및 총 투표수 집계
  const companyStats = new Map<
    string,
    {
      companyId: string;
      companyName: string;
      companyLogo: string;
      winCount: number;
      totalVotes: number;
      lastDecidedAt: string;
    }
  >();

  for (const champion of yearChampions) {
    const existing = companyStats.get(champion.companyId);
    if (existing) {
      existing.winCount += 1;
      existing.totalVotes += champion.totalVotes;
      if (champion.decidedAt > existing.lastDecidedAt) {
        existing.lastDecidedAt = champion.decidedAt;
      }
    } else {
      companyStats.set(champion.companyId, {
        companyId: champion.companyId,
        companyName: champion.companyName,
        companyLogo: champion.companyLogo,
        winCount: 1,
        totalVotes: champion.totalVotes,
        lastDecidedAt: champion.decidedAt,
      });
    }
  }

  // 대상 결정: 우승 횟수 > 총 투표수 순
  const sorted = Array.from(companyStats.values()).sort((a, b) => {
    if (b.winCount !== a.winCount) return b.winCount - a.winCount;
    return b.totalVotes - a.totalVotes;
  });

  const winner = sorted[0];
  if (!winner) return null;

  // 연도가 완료되었는지 확인 (12월까지 데이터가 있어야 대상 확정)
  const decemberChampion = yearChampions.find((c) => c.month === 12);
  const decidedAt = decemberChampion
    ? new Date(`${year + 1}-01-01T00:00:00Z`).toISOString()
    : new Date().toISOString();

  return {
    year,
    companyId: winner.companyId,
    companyName: winner.companyName,
    companyLogo: winner.companyLogo,
    winCount: winner.winCount,
    totalVotesInYear: winner.totalVotes,
    decidedAt,
  };
}

/**
 * Supabase에서 명예의 전당 데이터 조회
 */
async function fetchHallOfFameFromDB(): Promise<HallOfFameData | null> {
  const supabase = createServerClient();

  if (!supabase) {
    console.warn('[HallOfFame API] Supabase client not available');
    return null;
  }

  // kcl_seasons 테이블에서 모든 시즌 데이터 조회 (회사 정보 JOIN)
  const { data: seasons, error } = await supabase
    .from('kcl_seasons')
    .select(
      `
      id,
      year,
      month,
      champion_company_id,
      total_votes,
      decided_at,
      company:kcl_companies!champion_company_id (
        id,
        name_ko,
        name_en,
        logo_url,
        gradient_color
      )
    `,
    )
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (error) {
    console.error('[HallOfFame API] Supabase query error:', error.message);
    return null;
  }

  if (!seasons || seasons.length === 0) {
    // 데이터가 없으면 빈 응답 반환
    const currentYear = new Date().getFullYear();
    return {
      currentYear,
      latestGrandChampion: null,
      currentYearRace: [],
      currentYearMonthly: [],
      archives: [],
    };
  }

  // SeasonRecord로 타입 변환 (company가 배열로 올 수 있으므로 처리)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedSeasons: SeasonRecord[] = seasons.map((s: any) => ({
    id: s.id,
    year: s.year,
    month: s.month,
    champion_company_id: s.champion_company_id,
    total_votes: s.total_votes,
    decided_at: s.decided_at,
    company: Array.isArray(s.company) ? s.company[0] : s.company,
  }));

  // 모든 월간 챔피언 변환
  const allChampions = normalizedSeasons.map(toMonthlyChampion);

  // 현재 연도 결정
  const currentYear = new Date().getFullYear();

  // 현재 연도 월간 챔피언
  const currentYearMonthly = allChampions
    .filter((c) => c.year === currentYear)
    .sort((a, b) => a.month - b.month);

  // 현재 연도 대상 경쟁 현황
  const currentYearRace = calculateYearlyWinCount(allChampions, currentYear);

  // 역대 대상 수상자 (직전 연도들)
  const pastYears = [...new Set(allChampions.map((c) => c.year))]
    .filter((y) => y < currentYear)
    .sort((a, b) => b - a); // 최근 연도부터

  const archives: GrandChampion[] = [];
  for (const year of pastYears) {
    const grandChampion = determineGrandChampion(allChampions, year);
    if (grandChampion) {
      archives.push(grandChampion);
    }
  }

  // 직전 연도 대상 수상자 (latestGrandChampion)
  const lastYear = currentYear - 1;
  const latestGrandChampion = determineGrandChampion(allChampions, lastYear);

  return {
    currentYear,
    latestGrandChampion,
    currentYearRace,
    currentYearMonthly,
    archives,
  };
}

/**
 * GET /api/hall-of-fame
 *
 * 명예의 전당 전체 데이터 반환
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Supabase에서 데이터 조회 시도
    const dbData = await fetchHallOfFameFromDB();

    if (dbData) {
      const responseTime = Date.now() - startTime;
      console.log(`[HallOfFame API] DB fetch success (${responseTime}ms)`);

      return NextResponse.json(dbData, {
        headers: {
          'X-Data-Source': 'database',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // 2. Fallback: Mock 데이터 반환
    console.warn('[HallOfFame API] Falling back to mock data');
    const mockData = getMockHallOfFameData();

    return NextResponse.json(mockData, {
      headers: {
        'X-Data-Source': 'mock',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[HallOfFame API] Unexpected error:', error);

    // 에러 시에도 Mock 데이터 반환 (Graceful degradation)
    const mockData = getMockHallOfFameData();

    return NextResponse.json(mockData, {
      status: 200, // 클라이언트에게는 정상 응답
      headers: {
        'X-Data-Source': 'mock-fallback',
        'X-Error': 'true',
      },
    });
  }
}
