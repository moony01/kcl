/**
 * Supabase Browser Client (싱글톤 패턴)
 *
 * 브라우저 환경에서 사용하는 Supabase 클라이언트입니다.
 * SSG/CSR 마이그레이션: API Routes 대신 브라우저에서 직접 Supabase를 호출합니다.
 *
 * 특징:
 * - 싱글톤 패턴으로 인스턴스 재사용 (메모리 효율)
 * - NEXT_PUBLIC_* 환경변수만 사용 (클라이언트 안전)
 * - RLS(Row Level Security) 정책에 의존
 *
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase/client';
 *
 * const { data, error } = await supabase
 *   .from('kcl_companies')
 *   .select('*')
 *   .order('firepower', { ascending: false });
 * ```
 */

import { createBrowserClient } from '@supabase/ssr';

/** Supabase 클라이언트 타입 */
export type SupabaseClient = ReturnType<typeof createBrowserClient>;

/** 싱글톤 인스턴스 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase 브라우저 클라이언트 생성/반환 (싱글톤)
 *
 * 최초 호출 시에만 인스턴스를 생성하고, 이후에는 기존 인스턴스를 반환합니다.
 *
 * @returns Supabase 클라이언트 인스턴스
 * @throws 환경변수가 설정되지 않은 경우 에러
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[Supabase Client] 환경변수가 설정되지 않았습니다. ' +
        'NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.',
    );
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return supabaseInstance;
}

/**
 * Supabase 클라이언트 인스턴스 (편의용 export)
 *
 * 주의: 서버 사이드(SSR/SSG 빌드 시)에서는 환경변수가 없을 수 있으므로
 * 빌드 타임에서는 getSupabase() 함수를 사용하세요.
 *
 * @example
 * ```typescript
 * // 클라이언트 컴포넌트에서 직접 사용
 * import { supabase } from '@/lib/supabase/client';
 * const { data } = await supabase.from('kcl_companies').select('*');
 * ```
 */
export const supabase =
  typeof window !== 'undefined' ? getSupabase() : (null as unknown as SupabaseClient);

/**
 * 레거시 호환용: createClient 함수
 *
 * @deprecated getSupabase() 또는 supabase를 직접 사용하세요.
 */
export function createClient(): SupabaseClient {
  return getSupabase();
}
