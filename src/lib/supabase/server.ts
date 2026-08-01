/**
 * Supabase Server Client
 *
 * Cloudflare Workers Server Component용 Supabase 클라이언트
 * 서버 사이드 전용 (브라우저에서 사용 금지)
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * 서버 사이드 Supabase 클라이언트 생성
 *
 * 주의: 이 클라이언트는 서버 환경에서만 사용해야 합니다.
 * API Routes, Server Actions 등에서 사용합니다.
 *
 * @returns Supabase 클라이언트 인스턴스
 */
/**
 * 요청 쿠키를 사용하는 SSR 클라이언트.
 * Server Component에서는 쿠키를 읽을 수 있고, 갱신 쿠키는 Middleware가 반영합니다.
 */
export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing public environment variables for SSR client');
    return null;
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always mutate cookies; Middleware owns refresh writes.
        }
      },
    },
  });
}
