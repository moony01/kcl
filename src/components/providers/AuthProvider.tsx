'use client';

/**
 * AuthProvider - KCL 인증 상태 관리 프로바이더
 *
 * Supabase Auth의 세션 상태를 감지하고, 로그인된 사용자의 프로필 정보를
 * kcl_user_profiles 테이블에서 자동으로 조회하여 앱 전체에 제공합니다.
 *
 * 정적 빌드(output: 'export') 호환:
 * - 서버 액션/미들웨어 없이 순수 클라이언트 사이드에서 동작
 * - onAuthStateChange 리스너로 세션 변경 감지
 * - Supabase RLS 정책에 의존하여 보안 유지
 *
 * @example
 * ```tsx
 * // layout.tsx에서 래핑
 * <AuthProvider>
 *   <AppShell>{children}</AppShell>
 * </AuthProvider>
 *
 * // 하위 컴포넌트에서 사용
 * const { user, profile, isAuthenticated, signOut } = useContext(AuthContext);
 * ```
 */

import { createContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase/client';

/**
 * 사용자 프로필 타입 (kcl_user_profiles 테이블 스키마)
 */
export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  favorite_company_id: number | null;
  total_votes: number;
  created_at: string;
  updated_at: string;
}

/**
 * AuthContext에서 제공하는 인증 상태 및 메서드 타입
 */
export interface AuthContextType {
  /** Supabase auth.users 객체 (로그인되지 않으면 null) */
  user: User | null;
  /** kcl_user_profiles 테이블의 프로필 데이터 */
  profile: UserProfile | null;
  /** 인증 상태 로딩 중 여부 */
  isLoading: boolean;
  /** 로그인 여부 (user !== null) */
  isAuthenticated: boolean;
  /** 로그아웃 함수 */
  signOut: () => Promise<void>;
  /** 프로필 데이터 수동 새로고침 */
  refreshProfile: () => Promise<void>;
}

/**
 * 인증 컨텍스트 (기본값: 미인증 상태)
 */
export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

/**
 * AuthProvider 컴포넌트
 *
 * 앱 전체를 감싸서 인증 상태를 제공합니다.
 * Supabase의 onAuthStateChange 리스너를 통해 세션 변경을 실시간으로 감지합니다.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * kcl_user_profiles 테이블에서 사용자 프로필 조회
   * @param userId - auth.users의 id
   */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('kcl_user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('[AuthProvider] 프로필 조회 실패:', error.message);
        setProfile(null);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err) {
      console.warn('[AuthProvider] 프로필 조회 중 예외 발생:', err);
      setProfile(null);
    }
  }, []);

  /**
   * 프로필 데이터 수동 새로고침
   * (닉네임 변경 등 프로필 업데이트 후 호출)
   */
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  /**
   * 로그아웃 처리
   * Supabase 세션 종료 후 상태 초기화
   */
  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('[AuthProvider] 로그아웃 실패:', err);
    }
  }, []);

  /**
   * 초기 세션 확인 + 인증 상태 변경 리스너 등록
   */
  useEffect(() => {
    const supabase = getSupabase();

    // 1. 현재 세션 확인 (페이지 로드 시)
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.warn('[AuthProvider] 초기 세션 확인 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // 2. 인증 상태 변경 리스너 (로그인/로그아웃/토큰 갱신)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // 신규 가입(SIGNED_IN) 또는 토큰 갱신 시 프로필 조회
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await fetchProfile(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      },
    );

    // 3. 클린업: 리스너 해제
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * 컨텍스트 값 메모이제이션 (불필요한 리렌더 방지)
   */
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      signOut,
      refreshProfile,
    }),
    [user, profile, isLoading, signOut, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
