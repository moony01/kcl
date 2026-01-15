/**
 * Supabase Server Client
 *
 * API Routes 및 Server Actions에서 사용하는 Supabase 클라이언트
 * 서버 사이드 전용 (브라우저에서 사용 금지)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 서버 사이드 Supabase 클라이언트 생성
 *
 * 주의: 이 클라이언트는 서버 환경에서만 사용해야 합니다.
 * API Routes, Server Actions 등에서 사용합니다.
 *
 * @returns Supabase 클라이언트 인스턴스
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Service Role Key가 있으면 사용 (서버 전용 작업용)
  // 없으면 Anon Key 사용 (RLS 적용됨)
  const key = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !key) {
    // 개발 환경에서 환경변수가 없을 수 있음
    console.warn('[Supabase] Missing environment variables, returning null client');
    return null;
  }

  return createSupabaseClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
