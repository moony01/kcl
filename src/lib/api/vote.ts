/**
 * Vote API Layer
 *
 * 투표 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/vote 대체
 *
 * 테이블: kcl_votes, kcl_companies
 *
 * 주의:
 * - Rate Limit은 클라이언트의 useVoteQuota에서 처리
 * - 서버 사이드 Rate Limit(Redis)은 제거됨
 * - RLS 정책으로 보안 처리
 */

import { getSupabase } from '@/lib/supabase/client';

/** 1회 투표당 점수 */
const VOTE_SCORE = 1;

/** 투표 요청 파라미터 */
export interface SubmitVoteParams {
  /** 소속사 ID */
  companyId: string;
  /** 그룹 ID (선택) */
  groupId?: string | null;
}

/** 투표 결과 */
export interface VoteResult {
  /** 성공 여부 */
  success: boolean;
  /** 현재 점수 (업데이트 후) */
  currentScore?: number;
  /** 이번 투표 점수 */
  voteScore?: number;
  /** 에러 메시지 */
  message: string;
  /** 에러 코드 */
  errorCode?: 'INVALID_COMPANY' | 'SUPABASE_ERROR' | 'RPC_FAILED' | 'UNKNOWN';
}

/**
 * 투표 제출 (Supabase 직접 호출)
 *
 * 기존 /api/vote의 로직을 클라이언트에서 직접 실행합니다.
 *
 * 주의:
 * - Rate Limit은 useVoteQuota 훅에서 클라이언트 사이드로 처리
 * - 서버 사이드 IP 해싱은 RLS 정책으로 대체
 * - increment_firepower RPC 사용 (동시성 안전)
 *
 * @param params - 투표 파라미터
 * @returns 투표 결과
 *
 * @example
 * ```typescript
 * const result = await submitVote({ companyId: 'uuid-here' });
 * if (result.success) {
 *   console.log('투표 성공! 현재 점수:', result.currentScore);
 * }
 * ```
 */
export async function submitVote(params: SubmitVoteParams): Promise<VoteResult> {
  const { companyId, groupId } = params;
  const supabase = getSupabase();

  if (!companyId) {
    return {
      success: false,
      message: 'companyId is required',
      errorCode: 'INVALID_COMPANY',
    };
  }

  try {
    // 1. kcl_companies.firepower 업데이트 (RPC 사용)
    let newScore = 0;

    // increment_firepower RPC 호출 시도
    const { data: rpcData, error: rpcError } = await supabase.rpc('increment_firepower', {
      company_id: companyId,
      amount: VOTE_SCORE,
    });

    if (rpcError) {
      // RPC가 없을 경우 fallback: SELECT 후 UPDATE (race condition 가능성 있음)
      console.warn('[submitVote] RPC not available, using fallback. Error:', rpcError.message);

      const { data: company, error: selectError } = await supabase
        .from('kcl_companies')
        .select('firepower')
        .eq('id', companyId)
        .single();

      if (selectError || !company) {
        console.error('[submitVote] Failed to SELECT firepower:', selectError?.message);
        return {
          success: false,
          message: 'Company not found',
          errorCode: 'INVALID_COMPANY',
        };
      }

      newScore = (company.firepower || 0) + VOTE_SCORE;

      const { error: updateError } = await supabase
        .from('kcl_companies')
        .update({ firepower: newScore })
        .eq('id', companyId);

      if (updateError) {
        console.error('[submitVote] Failed to UPDATE firepower:', updateError.message);
        return {
          success: false,
          message: 'Failed to update vote count',
          errorCode: 'SUPABASE_ERROR',
        };
      }
    } else {
      newScore = rpcData as number;
    }

    // 2. kcl_votes 테이블에 투표 기록 저장 (비동기, 실패해도 무시)
    // SSG/CSR 환경: ip_hash는 NULL (서버 없음)
    // 스키마: vote_power (integer), ip_hash (nullable)
    supabase
      .from('kcl_votes')
      .insert({
        company_id: companyId,
        group_id: groupId || null,
        vote_power: VOTE_SCORE,
        ip_hash: null, // SSG 환경에서는 IP 해시 불가
        vote_source: 'web',
      })
      .then((result: { error: { message: string } | null }) => {
        if (result.error) {
          // 투표 기록 실패는 로깅만 (firepower는 이미 증가됨)
          console.warn('[submitVote] Failed to persist vote record:', result.error.message);
        }
      });

    return {
      success: true,
      currentScore: newScore,
      voteScore: VOTE_SCORE,
      message: 'Vote successful',
    };
  } catch (error) {
    console.error('[submitVote] Unexpected error:', error);
    return {
      success: false,
      message: 'Failed to submit vote',
      errorCode: 'UNKNOWN',
    };
  }
}

/** 투표 통계 */
export interface VoteStats {
  /** 전체 투표 수 */
  totalVotes: number;
  /** 오늘 투표 수 */
  todayVotes: number;
}

/**
 * 투표 통계 조회
 *
 * @returns 투표 통계 정보
 */
export async function getVoteStats(): Promise<VoteStats> {
  const supabase = getSupabase();

  try {
    // 전체 투표 수 (kcl_companies의 firepower 합계)
    const { data: companies, error: companiesError } = await supabase
      .from('kcl_companies')
      .select('firepower');

    if (companiesError) {
      console.error('[getVoteStats] Failed to fetch companies:', companiesError.message);
      return { totalVotes: 0, todayVotes: 0 };
    }

    const totalVotes = (companies || []).reduce(
      (sum: number, c: { firepower: number | null }) => sum + (c.firepower || 0),
      0,
    );

    // 오늘 투표 수 (시간 범위 필터)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { count: todayCount, error: todayError } = await supabase
      .from('kcl_votes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayISO);

    if (todayError) {
      console.warn('[getVoteStats] Failed to count today votes:', todayError.message);
    }

    return {
      totalVotes,
      todayVotes: todayCount || 0,
    };
  } catch (error) {
    console.error('[getVoteStats] Unexpected error:', error);
    return { totalVotes: 0, todayVotes: 0 };
  }
}
