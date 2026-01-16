/**
 * redis.ts
 *
 * Upstash Redis 클라이언트 및 캐싱 유틸리티
 *
 * 역할:
 * - Redis 클라이언트 인스턴스 관리 (싱글톤)
 * - 데이터 조회 캐싱 (TTL 기반)
 * - 캐시 무효화/갱신 유틸리티
 *
 * 캐시 키 규칙:
 * - kcl:companies:ranking - 전체 소속사 순위 데이터
 * - company:{id}:score - 개별 소속사 점수 (기존)
 * - global:total_votes - 전체 투표 수 (기존)
 */

import { Redis } from '@upstash/redis';

/**
 * 캐시 키 상수
 */
export const CACHE_KEYS = {
  /** 전체 소속사 순위 데이터 캐시 키 */
  COMPANIES_RANKING: 'kcl:companies:ranking',
  /** 개별 소속사 점수 패턴 (company:{id}:score) */
  COMPANY_SCORE: (companyId: string) => `company:${companyId}:score`,
  /** 전체 투표 수 */
  GLOBAL_TOTAL_VOTES: 'global:total_votes',
} as const;

/**
 * 캐시 TTL 상수 (초 단위)
 */
export const CACHE_TTL = {
  /** 소속사 순위 데이터 TTL - 25초 (polling 주기 20초보다 약간 길게) */
  COMPANIES_RANKING: 25,
  /** 개별 점수 TTL - 더 긴 기간 캐싱 가능 */
  COMPANY_SCORE: 60,
} as const;

/**
 * Redis 클라이언트 (환경변수가 설정된 경우에만 활성화)
 *
 * 싱글톤 패턴으로 하나의 인스턴스만 생성됩니다.
 */
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

/**
 * 캐시된 소속사 데이터 타입
 */
export interface CachedCompaniesData {
  companies: Array<{
    id: string;
    name_ko: string;
    name_en: string;
    slug: string;
    logo_url: string | null;
    gradient_color: string;
    rank: number;
    firepower: number;
    groups: Array<{
      id: string;
      name_ko: string;
      name_en: string;
      vote_count: number;
    }>;
  }>;
  totalCount: number;
  updatedAt: string;
  source: 'cache' | 'db';
}

/**
 * 소속사 순위 데이터 캐시 조회
 *
 * @returns 캐시된 데이터 또는 null (캐시 miss)
 */
export async function getCachedCompanies(): Promise<CachedCompaniesData | null> {
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get<CachedCompaniesData>(CACHE_KEYS.COMPANIES_RANKING);
    if (cached) {
      // 캐시 hit - source를 'cache'로 표시
      return {
        ...cached,
        source: 'cache',
      };
    }
    return null;
  } catch (error) {
    console.error('[Redis] Failed to get cached companies:', error);
    return null;
  }
}

/**
 * 소속사 순위 데이터 캐시 저장
 *
 * @param data - 저장할 소속사 데이터
 * @param ttl - TTL (초), 기본값: CACHE_TTL.COMPANIES_RANKING
 */
export async function setCachedCompanies(
  data: Omit<CachedCompaniesData, 'source'>,
  ttl: number = CACHE_TTL.COMPANIES_RANKING,
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.set(CACHE_KEYS.COMPANIES_RANKING, { ...data, source: 'db' }, { ex: ttl });
  } catch (error) {
    console.error('[Redis] Failed to set cached companies:', error);
    // 캐시 저장 실패는 무시하고 계속 진행
  }
}

/**
 * 소속사 순위 캐시 무효화
 *
 * 투표 발생 시 호출하여 다음 polling 때 최신 데이터를 가져오도록 합니다.
 */
export async function invalidateCompaniesCache(): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.del(CACHE_KEYS.COMPANIES_RANKING);
    console.log('[Redis] Companies cache invalidated');
  } catch (error) {
    console.error('[Redis] Failed to invalidate companies cache:', error);
    // 캐시 무효화 실패는 무시 (다음 TTL 만료 시 자동 갱신됨)
  }
}

/**
 * 소속사 순위 캐시 즉시 갱신
 *
 * 투표 성공 후 캐시를 즉시 업데이트하여 다음 API 호출 시 최신 데이터 제공
 *
 * @param fetchFn - DB에서 최신 데이터를 가져오는 함수
 */
export async function refreshCompaniesCache(
  fetchFn: () => Promise<Omit<CachedCompaniesData, 'source'>>,
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    const freshData = await fetchFn();
    await setCachedCompanies(freshData);
    console.log('[Redis] Companies cache refreshed');
  } catch (error) {
    console.error('[Redis] Failed to refresh companies cache:', error);
    // 갱신 실패 시 기존 캐시 무효화
    await invalidateCompaniesCache();
  }
}

export default redis;
