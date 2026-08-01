/**
 * Supabase Browser Client (싱글톤 패턴)
 *
 * 브라우저 환경에서 사용하는 Supabase 클라이언트입니다.
 * Cloudflare Workers SSR 마이그레이션: 브라우저와 서버가 공유할 수 있는
 * 쿠키 기반 세션을 사용합니다.
 *
 * @supabase/ssr의 createBrowserClient를 사용하면 OAuth 세션이 쿠키에 저장되어
 * Cloudflare Worker의 Server Component/Middleware에서도 같은 세션을 읽을 수 있습니다.
 *
 * 특징:
 * - 싱글톤 패턴으로 인스턴스 재사용 (메모리 효율)
 * - NEXT_PUBLIC_* 환경변수만 사용 (클라이언트 안전)
 * - RLS(Row Level Security) 정책에 의존
 * - PKCE 플로우로 OAuth 인증 (detectSessionInUrl 활성화)
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
import type { SupabaseClient } from '@supabase/supabase-js';

/** Supabase 클라이언트 타입을 re-export */
export type { SupabaseClient };

/** 싱글톤 인스턴스 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase 브라우저 클라이언트 생성/반환 (싱글톤)
 *
 * 최초 호출 시에만 인스턴스를 생성하고, 이후에는 기존 인스턴스를 반환합니다.
 * 브라우저 쿠키를 사용하여 서버와 세션을 공유하므로 Workers SSR에서도 동작합니다.
 *
 * @returns Supabase 클라이언트 인스턴스 (환경변수 누락 시 null as SupabaseClient)
 */
export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[Supabase Client] 환경변수가 설정되지 않았습니다. ' +
        'NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.',
    );
    // 빌드/미리보기에서 public env가 없는 경우에도 Client Component 셸을
    // 렌더링할 수 있도록 no-op 프록시를 반환합니다. 실제 브라우저 요청에서는
    // 반드시 공개 Supabase env가 주입되어야 합니다.
    const noopReturn = { data: { subscription: { unsubscribe: () => {} }, session: null, user: null }, error: null };
    const handler: ProxyHandler<object> = {
      get: () => new Proxy(() => noopReturn, handler),
    };
    return new Proxy({}, handler) as unknown as SupabaseClient;
  }

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      /** PKCE 플로우 사용 */
      flowType: 'pkce',
      /** @supabase/ssr이 쿠키 기반 브라우저 storage를 관리 */
      persistSession: true,
      /**
       * URL 세션 자동 감지 비활성화
       * - 콜백 페이지에서 수동 교환으로 일원화
       * - 자동 교환과 수동 교환의 경쟁 상태 방지
       */
      detectSessionInUrl: false,
      /** 자동 토큰 갱신 활성화 */
      autoRefreshToken: true,
    },
  });

  return supabaseInstance;
}

/**
 * Supabase 클라이언트 인스턴스 (편의용 export)
 *
 * 주의: 서버 Component/Middleware에서는 이 브라우저 클라이언트를 사용하지 말고
 * createServerClient()를 사용하세요.
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
