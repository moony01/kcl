'use client';

/**
 * OAuth 콜백 처리 클라이언트.
 *
 * Workers SSR 전환 이후 Supabase 브라우저 클라이언트가 쿠키 세션을
 * 사용하므로, 콜백에서도 localStorage 폴링 대신 PKCE 교환 결과를 직접
 * 확인하고 안전한 내부 경로로 이동합니다.
 */

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabase } from '@/lib/supabase/client';

const LAST_PROVIDER_KEY = 'kcl_last_login_provider';
const RETURN_TO_ORIGINS = new Set([
  'https://moony01.com',
  'https://www.moony01.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
]);

let exchangingCode: string | null = null;

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('oauth_timeout')), ms);
  });
  return Promise.race([promise, timeout]);
}

function getSafeReturnTo(value: string | null): string | null {
  if (!value) return null;

  try {
    const target = new URL(value);
    const isKpopfacePath = target.pathname === '/kpopface' || target.pathname.startsWith('/kpopface/');
    if (RETURN_TO_ORIGINS.has(target.origin) && isKpopfacePath) {
      return target.href;
    }
  } catch {
    // Invalid or untrusted return URLs are ignored.
  }

  return null;
}

function saveLastProvider(provider: unknown): void {
  if (typeof provider !== 'string' || !provider) return;
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // Private browsing/local storage restrictions are non-fatal.
  }
}

function isProviderConflictError(errorDescription: string | null): boolean {
  if (!errorDescription) return false;
  const lower = errorDescription.toLowerCase();
  return (
    lower.includes('already registered') ||
    lower.includes('identity already exists') ||
    lower.includes('email already') ||
    lower.includes('user already registered') ||
    lower.includes('cannot be linked')
  );
}

function CallbackHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('Auth');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locale = pathname.split('/')[1] || 'en';
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (errorParam) {
      if (isProviderConflictError(errorDescription)) {
        const lastProvider = localStorage.getItem(LAST_PROVIDER_KEY) || '';
        window.location.href = `/${locale}/login?conflict=true&provider=${encodeURIComponent(lastProvider)}`;
        return;
      }

      const errorMessages: Record<string, string> = {
        access_denied: t('error_oauth_access_denied'),
        server_error: t('error_oauth_server'),
        temporarily_unavailable: t('error_oauth_unavailable'),
        invalid_request: t('error_oauth_invalid_request'),
        unauthorized_client: t('error_oauth_unauthorized'),
      };
      setError(errorMessages[errorParam] || t('error_oauth_generic'));
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setError(t('error_oauth_generic'));
      return;
    }

    if (exchangingCode === code) return;
    exchangingCode = code;

    const supabase = getSupabase();
    const flow = searchParams.get('flow');
    const safeReturnTo = getSafeReturnTo(searchParams.get('returnTo'));
    let cancelled = false;

    const resolveAndRedirect = async () => {
      try {
        const { data, error: exchangeError } = await withTimeout(
          supabase.auth.exchangeCodeForSession(code),
          15000,
        );
        if (exchangeError || !data.session) {
          throw new Error(exchangeError?.message || 'oauth_exchange_failed');
        }

        const session = data.session;
        saveLastProvider(session.user.app_metadata?.provider);

        let redirectPath = `/${locale}`;
        if (flow === 'signup') {
          redirectPath = `/${locale}/onboarding`;
        } else if (safeReturnTo) {
          redirectPath = safeReturnTo;
        } else {
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            const profileResponse = await fetch(
              `${supabaseUrl}/rest/v1/kcl_user_profiles?id=eq.${session.user.id}&select=favorite_group_id`,
              {
                headers: {
                  apikey: supabaseKey || '',
                  Authorization: `Bearer ${session.access_token}`,
                  Accept: 'application/json',
                },
              },
            );
            if (profileResponse.ok) {
              const rows = await profileResponse.json();
              if (!rows?.[0]?.favorite_group_id) redirectPath = `/${locale}/onboarding`;
            }
          } catch {
            // A profile lookup failure falls back to the localized home page.
          }
        }

        if (!cancelled) window.location.replace(redirectPath);
      } catch (callbackError) {
        if (!cancelled) {
          console.warn('[OAuth Callback] session exchange failed:', callbackError);
          setError(
            callbackError instanceof Error && callbackError.message === 'oauth_timeout'
              ? t('error_oauth_timeout')
              : t('error_oauth_generic'),
          );
        }
      }
    };

    void resolveAndRedirect();
    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams, t]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>:(</div>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem', maxWidth: '400px', lineHeight: 1.5 }}>{error}</p>
        <button
          type="button"
          onClick={() => { window.location.href = `/${pathname.split('/')[1] || 'en'}`; }}
          style={{ marginTop: '8px', padding: '10px 24px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          {t('go_home')}
        </button>
      </div>
    );
  }

  return <LoadingSpinner />;
}

function LoadingSpinner() {
  const t = useTranslations('Auth');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary, #8B5CF6)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>{t('callback_loading')}</p>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );
}

export default function CallbackClient() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
