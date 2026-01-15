/**
 * Vote API
 *
 * 투표 처리 엔드포인트
 *
 * 규칙:
 * - 1회 투표 = 1점 (기존 100점에서 변경)
 * - IP 기반 Rate Limit (1시간당 30회)
 * - 클라이언트에 남은 투표권 정보 반환
 * - Redis 카운터 + Supabase 영속성 이중 저장
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { checkVoteRateLimit } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/hash';

/** 1회 투표당 점수 */
const VOTE_SCORE = 1;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

/**
 * 클라이언트 IP 추출
 */
function getClientIP(req: NextRequest): string {
  // Vercel/Cloudflare 환경에서 실제 IP 추출
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return '127.0.0.1';
}

/**
 * 투표를 Supabase에 영속화
 *
 * Redis 카운터와 별도로 kcl_votes 테이블에 투표 기록을 저장합니다.
 * 실패해도 사용자 응답에는 영향 없음 (graceful degradation)
 */
async function persistVote(
  companyId: string,
  groupId: string | null,
  ipHash: string,
): Promise<void> {
  const supabase = createServerClient();

  if (!supabase) {
    console.warn('[Vote] Supabase client not available, skipping persistence');
    return;
  }

  const { error } = await supabase.from('kcl_votes').insert({
    company_id: companyId,
    group_id: groupId || null,
    ip_hash: ipHash,
    score: VOTE_SCORE,
  });

  if (error) {
    // DB 저장 실패는 로깅만 하고 throw하지 않음
    // Redis 카운터가 이미 증가했으므로 사용자에게는 성공 응답
    console.error('[Vote] Failed to persist vote to Supabase:', error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    // IP 기반 Rate Limit 검사
    const clientIP = getClientIP(req);
    const rateLimitResult = await checkVoteRateLimit(clientIP);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Too many votes. Please try again later.',
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { companyId, groupId } = body;

    if (!companyId) {
      return NextResponse.json({ success: false, message: 'Missing companyId' }, { status: 400 });
    }

    let newScore = 0;

    if (redis) {
      // 1점 증가 (기존 100점에서 변경)
      newScore = await redis.incrby(`company:${companyId}:score`, VOTE_SCORE);
      // 전체 투표 수 카운트
      await redis.incrby('global:total_votes', 1);
    } else {
      // 개발 환경 Mock
      console.log(`[MOCK REDIS /vote] Voted Company ${companyId}, +${VOTE_SCORE} point`);
      newScore = Math.floor(Math.random() * 1000000) + VOTE_SCORE;
    }

    // Supabase에 투표 기록 영속화 (비동기, 실패해도 응답에 영향 없음)
    const ipHash = hashIp(clientIP);
    persistVote(companyId, groupId || null, ipHash).catch((err) => {
      console.error('[Vote] Unexpected error in persistVote:', err);
    });

    return NextResponse.json({
      success: true,
      currentScore: newScore,
      voteScore: VOTE_SCORE,
      remaining: rateLimitResult.remaining,
      message: 'Vote successful',
    });
  } catch (error) {
    console.error('Vote API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
