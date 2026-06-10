/**
 * Hall of Fame API Layer
 *
 * 명예의 전당 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/hall-of-fame 대체
 *
 * 테이블: kcl_seasons, kcl_companies
 */

import { getSupabase } from '@/lib/supabase/client';
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
    companyLogoUrl: record.company?.logo_url || undefined,
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
        companyLogoUrl: champion.companyLogoUrl,
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
      companyLogoUrl?: string;
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
        companyLogoUrl: champion.companyLogoUrl,
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
    companyLogoUrl: winner.companyLogoUrl,
    winCount: winner.winCount,
    totalVotesInYear: winner.totalVotes,
    decidedAt,
  };
}

/**
 * 명예의 전당 데이터 조회 (Supabase 직접 호출)
 *
 * 기존 /api/hall-of-fame의 로직을 클라이언트에서 직접 실행합니다.
 *
 * @returns 명예의 전당 전체 데이터
 *
 * @example
 * ```typescript
 * const data = await getHallOfFame();
 * console.log('현재 연도 챔피언:', data.currentYearMonthly);
 * console.log('대상 경쟁:', data.currentYearRace);
 * ```
 */
export async function getHallOfFame(): Promise<HallOfFameData> {
  const supabase = getSupabase();
  const currentYear = new Date().getFullYear();

  try {
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
      console.error('[getHallOfFame] Supabase query error:', error.message);
      throw error;
    }

    if (!seasons || seasons.length === 0) {
      // 데이터가 없으면 빈 응답 반환
      return {
        currentYear,
        latestGrandChampion: null,
        currentYearRace: [],
        currentYearMonthly: [],
      };
    }

    // SeasonRecord로 타입 변환 (company가 배열로 올 수 있으므로 처리)
    const normalizedSeasons: SeasonRecord[] = seasons.map(
      (s: {
        id: string;
        year: number;
        month: number;
        champion_company_id: string;
        total_votes: number;
        decided_at: string;
        company: SeasonRecord['company'] | SeasonRecord['company'][] | null;
      }) => ({
        id: s.id,
        year: s.year,
        month: s.month,
        champion_company_id: s.champion_company_id,
        total_votes: s.total_votes,
        decided_at: s.decided_at,
        company: Array.isArray(s.company) ? s.company[0] : s.company,
      }),
    );

    // 모든 월간 챔피언 변환
    const allChampions = normalizedSeasons.map(toMonthlyChampion);

    // 현재 연도 월간 챔피언
    const currentYearMonthly = allChampions
      .filter((c) => c.year === currentYear)
      .sort((a, b) => a.month - b.month);

    // 현재 연도 대상 경쟁 현황
    const currentYearRace = calculateYearlyWinCount(allChampions, currentYear);

    // 직전 연도 대상 수상자 (latestGrandChampion)
    const lastYear = currentYear - 1;
    const latestGrandChampion = determineGrandChampion(allChampions, lastYear);

    return {
      currentYear,
      latestGrandChampion,
      currentYearRace,
      currentYearMonthly,
    };
  } catch (error) {
    console.error('[getHallOfFame] Unexpected error:', error);
    // 에러 시 빈 데이터 반환
    return {
      currentYear,
      latestGrandChampion: null,
      currentYearRace: [],
      currentYearMonthly: [],
    };
  }
}
