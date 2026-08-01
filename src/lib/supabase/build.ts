/**
 * Build-time Supabase client.
 *
 * This module intentionally has no `next/headers` import so it can be used by
 * shared API helpers that are also imported by Client Components.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createBuildClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = supabaseServiceKey || supabaseAnonKey;

  if (!supabaseUrl || !key) {
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
