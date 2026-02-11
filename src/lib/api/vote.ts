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
 * 브라우저 fingerprint 생성
 * User-Agent, 화면 크기, 타임존, 언어 등을 조합한 해시
 * 완벽하지 않지만 localStorage 우회 공격을 방어
 */
function generateFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const components = [
    navigator.userAgent,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.hardwareConcurrency?.toString() || '',
    navigator.maxTouchPoints?.toString() || '',
  ];

  // 간단한 해시 (djb2 알고리즘)
  const str = components.join('|');
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return `fp_${(hash >>> 0).toString(36)}`;
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
    const { data, error } = await supabase.rpc('submit_vote_secure', {
      p_company_id: companyId,
      p_group_id: groupId || null,
      p_fingerprint: null,
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
