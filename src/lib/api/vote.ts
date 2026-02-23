/**
 * Vote API Layer
 *
 * 투표 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/vote 대체
 *
 * 테이블: kcl_votes, kcl_companies
 *
 * 보안:
 * - 서버 사이드 Rate Limit: submit_vote_secure RPC에서 fingerprint 기반 일일 30회 제한
 * - 클라이언트 사이드 Rate Limit: useVoteQuota 훅 (UX용 보조)
 * - RLS 정책으로 데이터 접근 보안
 */

import { getSupabase } from '@/lib/supabase/client';

/** 투표 요청 파라미터 */
export interface SubmitVoteParams {
  /** 소속사 ID */
  companyId: string;
  /** 그룹 ID (선택) */
  groupId?: string | null;
  /** 로그인 사용자 ID (선택, 로그인 시 월간 60표 적용) */
  userId?: string | null;
  /** 투표 파워 (비회원: 1 고정, 회원: 1~30, Pro: 1~50, 롱프레스 파워투표 시 사용) */
  votePower?: number;
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
  errorCode?: 'INVALID_COMPANY' | 'SUPABASE_ERROR' | 'RATE_LIMITED' | 'UNKNOWN';
  /** 오늘 남은 투표 수 */
  remaining?: number;
}

/**
 * 투표 제출 (서버 사이드 Rate Limiting 적용)
 *
 * submit_vote_secure RPC를 통해 서버에서 fingerprint 기반 일일 제한을 검증합니다.
 * - 서버 사이드: fingerprint 기반 일일 30회 제한 (RPC 내부)
 * - 클라이언트 사이드: useVoteQuota 훅으로 UX 보조
 *
 * @param params - 투표 파라미터
 * @returns 투표 결과
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
    // T1.82: 서버 fingerprint 체크 비활성화 — localStorage 기반 쿼타만 사용
    // 사용자 수가 적은 초기 단계에서는 클라이언트 제한으로 충분
    // 추후 사용자 증가 시 fingerprint 기반 서버 제한 재활성화 예정
    //
    // T1.85: 로그인 사용자 지원 추가
    // - p_user_id: 로그인 사용자 ID (서버에서 월간 60표 제한 검증)
    // - p_vote_power: 파워투표 점수 (1~50, 롱프레스 게이지)
    const { data, error } = await supabase.rpc('submit_vote_secure', {
      p_company_id: companyId,
      p_group_id: groupId || null,
      p_fingerprint: null,
      p_user_id: params.userId || null,
      p_vote_power: params.votePower || 1,
    });

    if (error) {
      console.error('[submitVote] RPC error:', error.message);
      return {
        success: false,
        message: 'Failed to submit vote',
        errorCode: 'SUPABASE_ERROR',
      };
    }

    const result = data as {
      success: boolean;
      message: string;
      error_code?: string;
      current_score?: number;
      vote_score?: number;
      remaining?: number;
    };

    if (!result.success) {
      return {
        success: false,
        message: result.message,
        errorCode: (result.error_code as VoteResult['errorCode']) || 'UNKNOWN',
        remaining: result.remaining,
      };
    }

    return {
      success: true,
      currentScore: result.current_score,
      voteScore: result.vote_score,
      message: result.message,
      remaining: result.remaining,
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

/** 로그인 사용자 투표 통계 (get_user_vote_stats RPC 결과) */
export interface UserVoteStats {
  /** 오늘 사용한 투표 수 */
  dailyUsed: number;
  /** 오늘 남은 투표 수 */
  dailyRemaining: number;
  /** 일일 투표 한도 (Free: 60, Pro: 300) */
  dailyLimit: number;
  /** 총 누적 투표 수 */
  totalVotes: number;
  /** 가장 많이 투표한 상위 5개 소속사 */
  topCompanies: Array<{
    company_id: string;
    company_name: string;
    vote_count: number;
    gradient_color?: string;
  }>;
}

/**
 * 로그인 사용자 투표 통계 조회
 *
 * get_user_vote_stats RPC를 호출하여 일일/총 투표 현황을 반환합니다.
 *
 * @param userId - 사용자 ID (auth.users.id)
 * @returns 사용자 투표 통계
 */
export async function getUserVoteStats(userId: string): Promise<UserVoteStats | null> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase.rpc('get_user_vote_stats', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[getUserVoteStats] RPC error:', error.message);
      return null;
    }

    const result = data as {
      daily_used: number;
      daily_remaining: number;
      daily_limit: number;
      total_votes: number;
      top_companies: Array<{
        company_id?: string;
        company_name?: string;
        vote_count?: number;
        /** RPC가 실제 반환하는 필드명 */
        votes?: number;
        name_en?: string;
        name_ko?: string;
        gradient_color?: string;
      }>;
    };

    // RPC 응답 필드명 매핑: votes→vote_count, name_en→company_name
    const topCompanies = (result.top_companies || []).map((c) => ({
      company_id: c.company_id || c.name_en || '',
      company_name: c.company_name || c.name_en || '',
      vote_count: c.vote_count ?? c.votes ?? 0,
      gradient_color: c.gradient_color,
    }));

    return {
      dailyUsed: result.daily_used,
      dailyRemaining: result.daily_remaining,
      dailyLimit: result.daily_limit,
      totalVotes: result.total_votes,
      topCompanies,
    };
  } catch (error) {
    console.error('[getUserVoteStats] Unexpected error:', error);
    return null;
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
