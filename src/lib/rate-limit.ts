/**
 * rate-limit.ts
 *
 * Upstash Rate Limit 유틸리티
 * 투표 API에 Rate Limiting을 적용합니다.
 *
 * 규칙:
 * - IP 기반 제한 (서버 사이드 방어선)
 * - 1시간당 30회 (sliding window)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Redis 클라이언트 (환경변수가 설정된 경우에만 활성화)
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

/**
 * 투표 Rate Limiter
 * - Sliding Window 알고리즘 사용
 * - 1시간당 30회 제한
 * - IP 기반 식별
 */
export const voteLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1h'), // 1시간당 30회
      prefix: 'kcl:vote',
      analytics: true, // Upstash 콘솔에서 분석 데이터 확인 가능
    })
  : null;

/**
 * Rate Limit 검사 결과 타입
 */
export interface RateLimitResult {
  /** Rate Limit 통과 여부 */
  success: boolean;
  /** 남은 요청 횟수 */
  remaining: number;
  /** 리셋까지 남은 시간 (ms) */
  reset: number;
}

/**
 * IP 기반 Rate Limit 검사
 * @param ip 클라이언트 IP 주소
 * @returns Rate Limit 검사 결과
 */
export async function checkVoteRateLimit(ip: string): Promise<RateLimitResult> {
  // Rate Limiter가 없으면 (개발 환경) 항상 성공
  if (!voteLimiter) {
    return {
      success: true,
      remaining: 30,
      reset: Date.now() + 3600000, // 1시간 후
    };
  }

  const result = await voteLimiter.limit(ip);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
