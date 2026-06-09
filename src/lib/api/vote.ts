/**
 * Vote API Layer
 *
 * 투표 관련 Supabase 직접 호출 함수들
 * SSG/CSR 마이그레이션: /api/vote 대체
 *
 * 테이블: kcl_votes, kcl_companies
 *
 * 보안:
 * - 서버 사이드 Rate Limit: submit_vote_secure RPC에서 비회원 100회/로그인 회원 300회/운영 override 500회 제한
 * - 클라이언트 사이드 Rate Limit: useVoteQuota 훅 (비회원 localStorage 100회, UX용 보조)
 * - RLS 정책으로 데이터 접근 보안
 */

import { VOTE_LIMITS } from '@/config/vote';
import { getSupabase } from '@/lib/supabase/client';

const GUEST_VOTER_ID_KEY = 'kcl_guest_voter_id';

function getGuestVoteFingerprint(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(GUEST_VOTER_ID_KEY);
    if (stored) return stored;

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_VOTER_ID_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

/** 투표 요청 파라미터 */
export interface SubmitVoteParams {
  /** 소속사 ID */
  companyId: string;
  /** 그룹 ID (선택) */
  groupId?: string | null;
  /** 로그인 사용자 ID (선택, 로그인 시 일일 300표/운영 override 적용) */
  userId?: string | null;
  /** 투표 파워 (1~100, 롱프레스 파워투표 시 사용) */
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
  errorCode?: 'INVALID_COMPANY' | 'SUPABASE_ERROR' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'UNKNOWN';
  /** 오늘 남은 투표 수 */
  remaining?: number;
}

/**
 * 투표 제출 (서버 사이드 Rate Limiting 적용)
 *
 * submit_vote_secure RPC를 통해 서버에서 로그인 사용자의 일일 제한을 검증합니다.
 * - 서버 사이드: 회원 300표/일, 운영 override 500표/일, 파워투표 최대 x100
 * - 클라이언트 사이드: 비회원 100표 localStorage + useVoteQuota 훅으로 UX 보조
 *
 * @param params - 투표 파라미터
 * @returns 투표 결과
 */
export async function submitVote(params: SubmitVoteParams): Promise<VoteResult> {
  const { companyId, groupId } = params;
  const supabase = getSupabase();
  const votePower = Math.min(Math.max(Math.floor(params.votePower || 1), 1), VOTE_LIMITS.POWER_MAX);
  const userId = params.userId || null;
  const fingerprint = userId ? null : getGuestVoteFingerprint();

  if (!companyId) {
    return {
      success: false,
      message: 'companyId is required',
      errorCode: 'INVALID_COMPANY',
    };
  }

  try {
    // 2026-06: 로그인 사용자 일일 한도/파워투표 정책
    // - p_user_id: 로그인 사용자 ID (서버에서 회원 300표/운영 override 500표 검증)
    // - p_vote_power: 파워투표 점수 (1~100, 롱프레스 게이지)
    const { data, error } = await supabase.rpc('submit_vote_secure', {
      p_company_id: companyId,
      p_group_id: groupId || null,
      p_fingerprint: fingerprint,
      p_daily_limit: VOTE_LIMITS.GUEST_DAILY,
      p_user_id: userId,
      p_vote_power: votePower,
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
  /** 일일 투표 한도 (회원: 300, 운영 override: 500) */
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

    // 오늘 투표 수 (UTC 일일 리셋 기준)
    const now = new Date();
    const todayISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

    const { data: todayVotes, error: todayError } = await supabase
      .from('kcl_votes')
      .select('vote_power')
      .gte('created_at', todayISO);

    if (todayError) {
      console.warn('[getVoteStats] Failed to fetch today votes:', todayError.message);
    }

    const todayVoteScore = (todayVotes || []).reduce(
      (sum: number, vote: { vote_power: number | null }) => sum + (vote.vote_power || 1),
      0,
    );

    return {
      totalVotes,
      todayVotes: todayVoteScore,
    };
  } catch (error) {
    console.error('[getVoteStats] Unexpected error:', error);
    return { totalVotes: 0, todayVotes: 0 };
  }
}
