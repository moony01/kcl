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
 *
 * T1.30: 투표 성공 후 캐시 무효화
 * - 소속사 순위 캐시(kcl:companies:ranking) 무효화
 * - 다음 polling 시 최신 데이터 반영
 *
 * T1.29: 투표 후 점수 즉시 반영 버그 수정
 * - kcl_companies.firepower 컬럼을 동기적으로 업데이트
 * - /api/companies에서 Supabase를 조회하므로 firepower 동기화 필수
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkVoteRateLimit } from '@/lib/rate-limit';
import { createServerClient } from '@/lib/supabase/server';
import { hashIp } from '@/lib/hash';
import { redis, invalidateCompaniesCache, CACHE_KEYS } from '@/lib/redis';

/** 1회 투표당 점수 */
const VOTE_SCORE = 1;

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

/**
 * T1.29: kcl_companies.firepower 업데이트
 *
 * 투표 성공 후 소속사의 firepower 컬럼을 증가시킵니다.
 * /api/companies에서 Supabase를 직접 조회하므로 이 업데이트가 필수입니다.
 *
 * @param companyId - 소속사 ID
 * @returns 업데이트된 firepower 값 (실패 시 null)
 */
async function updateCompanyFirepower(companyId: string): Promise<number | null> {
  const supabase = createServerClient();

  if (!supabase) {
    console.warn('[Vote] Supabase client not available, skipping firepower update');
    return null;
  }

  // RPC 호출로 atomic increment 수행 (동시성 안전)
  // Supabase는 기본적으로 increment RPC를 제공하지 않으므로 직접 쿼리
  const { data, error } = await supabase.rpc('increment_firepower', {
    company_id: companyId,
    amount: VOTE_SCORE,
  });

  if (error) {
    // RPC가 없을 경우 fallback: SELECT 후 UPDATE (race condition 가능성 있음)
    console.warn('[Vote] RPC increment_firepower not available, using fallback:', error.message);

    const { data: company, error: selectError } = await supabase
      .from('kcl_companies')
      .select('firepower')
      .eq('id', companyId)
      .single();

    if (selectError || !company) {
      console.error('[Vote] Failed to get current firepower:', selectError?.message);
      return null;
    }

    const newFirepower = (company.firepower || 0) + VOTE_SCORE;

    const { error: updateError } = await supabase
      .from('kcl_companies')
      .update({ firepower: newFirepower })
      .eq('id', companyId);

    if (updateError) {
      console.error('[Vote] Failed to update firepower:', updateError.message);
      return null;
    }

    return newFirepower;
  }

  return data as number;
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

    // T1.29: kcl_companies.firepower를 먼저 동기적으로 업데이트
    // /api/companies에서 Supabase를 조회하므로 이 업데이트가 UI 반영의 핵심!
    const updatedFirepower = await updateCompanyFirepower(companyId);

    if (updatedFirepower !== null) {
      newScore = updatedFirepower;
      console.log(`[Vote] Company ${companyId} firepower updated to ${newScore}`);
    }

    if (redis) {
      // Redis에도 점수 동기화 (캐시 용도)
      // Supabase가 실패한 경우에만 Redis 값 사용
      if (updatedFirepower === null) {
        newScore = await redis.incrby(CACHE_KEYS.COMPANY_SCORE(companyId), VOTE_SCORE);
      } else {
        // Supabase 값으로 Redis 동기화 (선택적)
        await redis.set(CACHE_KEYS.COMPANY_SCORE(companyId), newScore);
      }

      // 전체 투표 수 카운트
      await redis.incrby(CACHE_KEYS.GLOBAL_TOTAL_VOTES, 1);

      // T1.30: 투표 성공 후 소속사 순위 캐시 무효화
      // 비동기로 실행하여 응답 지연 방지
      invalidateCompaniesCache().catch((err) => {
        console.error('[Vote] Failed to invalidate cache:', err);
      });
    } else if (updatedFirepower === null) {
      // 개발 환경 Mock (Redis도 Supabase도 없는 경우)
      console.log(`[MOCK /vote] Voted Company ${companyId}, +${VOTE_SCORE} point`);
      newScore = Math.floor(Math.random() * 1000000) + VOTE_SCORE;
    }

    // Supabase에 투표 기록 영속화 (비동기, 실패해도 응답에 영향 없음)
    const ipHash = await hashIp(clientIP);
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
