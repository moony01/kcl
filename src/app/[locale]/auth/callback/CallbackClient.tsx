'use client';

/**
 * CallbackClient - OAuth 콜백 처리 클라이언트 컴포넌트
 *
 * Google/Kakao OAuth 인증 완료 후 리다이렉트되는 페이지의 클라이언트 로직입니다.
 * PKCE(Proof Key for Code Exchange) 플로우를 사용하여
 * 정적 빌드(output: 'export')에서도 동작합니다.
 *
 * 플로우:
 * 1. OAuth 제공자 인증 완료 → /auth/callback?code=XXX 로 리다이렉트
 * 2. 클라이언트에서 supabase.auth.exchangeCodeForSession(code) 호출 (fire-and-forget)
 * 3. localStorage 폴링으로 세션 토큰 감지 → 리다이렉트
 *
 * 주의: Supabase GoTrueClient가 내부 navigator.locks를 사용하여
 * exchangeCodeForSession / getSession의 Promise가 무한 대기할 수 있음.
 * 이를 우회하기 위해 localStorage 직접 폴링 방식을 사용합니다.
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getSupabase } from '@/lib/supabase/client';

/** 마지막 로그인 프로바이더 localStorage 키 */
const LAST_PROVIDER_KEY = 'kcl_last_login_provider';

/**
 * OAuth 콜백 URL 또는 Supabase 세션에서 프로바이더 이름 추출
 * Supabase 세션의 app_metadata.provider 필드를 사용
 */
function getProviderFromSession(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const provider = parsed?.user?.app_metadata?.provider;
        if (provider && typeof provider === 'string') {
          return provider;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 마지막 로그인 프로바이더를 localStorage에 저장
 * 로그인 페이지에서 "마지막으로 OOO로 로그인했어요" 뱃지 표시에 사용
 */
function saveLastProvider(provider: string): void {
  try {
    localStorage.setItem(LAST_PROVIDER_KEY, provider);
  } catch {
    // localStorage 접근 실패 시 무시 (Private 브라우징 등)
  }
}

/**
 * 프로바이더 충돌 에러인지 감지
 * Supabase가 동일 이메일 + 다른 프로바이더 충돌 시 반환하는 에러 패턴 매칭
 * (Automatic Linking 비활성화 시 또는 엣지 케이스에서 발생 가능)
 */
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

/**
 * 모듈 레벨 교환 추적
 * React Strict Mode에서 useEffect가 두 번 실행되어
 * PKCE 코드를 중복 교환하는 것을 방지합니다.
 * (PKCE 코드는 일회용이므로 두 번째 교환은 반드시 실패)
 */
let exchangingCode: string | null = null;

/**
 * localStorage에서 Supabase 세션을 직접 읽어 user id와 access_token을 반환
 * navigator.locks에 의존하지 않으므로 lock 대기 없이 즉시 반환됨
 *
 * Supabase는 세션을 `sb-{project-ref}-auth-token` 키로 저장합니다.
 * 키 이름을 런타임에 동적 탐색하여 환경변수 인라인 문제를 우회합니다.
 */
function getSessionFromStorage(): { userId: string; accessToken: string } | null {
  try {
    // localStorage에서 sb-...-auth-token 패턴 키를 찾아 세션 읽기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.user?.id && parsed?.access_token) {
          return { userId: parsed.user.id, accessToken: parsed.access_token };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 콜백 처리 내부 컴포넌트 (Suspense 바운더리 내에서 useSearchParams 사용)
 *
 * exchangeCodeForSession은 fire-and-forget으로 실행하고,
 * localStorage 폴링으로 세션 확립을 감지하여 리다이렉트합니다.
 * Supabase 내부 lock에 의한 Promise 무한 대기를 완전히 우회합니다.
 */
function CallbackHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations('Auth');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const locale = pathname.split('/')[1] || 'en';
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // OAuth 에러 파라미터가 있는 경우 (XSS 방지: 화이트리스트 방식)
    if (errorParam) {
      if (errorDescription) {
        console.error('[OAuth Callback] Error:', errorParam, errorDescription);
      }

      // 프로바이더 충돌 에러 감지 → 로그인 페이지로 안내 리다이렉트
      if (isProviderConflictError(errorDescription)) {
        console.warn('[OAuth Callback] 프로바이더 충돌 감지:', errorDescription);
        // 기존에 저장된 마지막 프로바이더 정보로 안내
        const lastProvider = localStorage.getItem(LAST_PROVIDER_KEY) || '';
        window.location.href = `/${locale}/login?conflict=true&provider=${encodeURIComponent(lastProvider)}`;
        return;
      }

      const errorMessages: Record<string, string> = {
        'access_denied': t('error_oauth_access_denied'),
        'server_error': t('error_oauth_server'),
        'temporarily_unavailable': t('error_oauth_unavailable'),
        'invalid_request': t('error_oauth_invalid_request'),
        'unauthorized_client': t('error_oauth_unauthorized'),
      };
      setError(errorMessages[errorParam] || t('error_oauth_generic'));
      return;
    }

    const code = searchParams.get('code');
    if (!code) {
      setError(t('error_oauth_generic'));
      return;
    }

    const supabase = getSupabase();
    const flow = searchParams.get('flow');
    const forceOnboarding = flow === 'signup';
    let redirected = false;

    /**
     * 프로필 조회 후 리다이렉트 경로 결정 + 이동
     *
     * 주의: supabase.from() 사용 금지!
     * Supabase 클라이언트는 DB 쿼리 시 내부적으로 getSession()을 호출하여
     * auth 토큰을 헤더에 추가하는데, 이때도 navigator.locks에 걸릴 수 있음.
     * fetch()로 Supabase REST API를 직접 호출하여 완전히 우회합니다.
     */
    const resolveAndRedirect = async (userId: string, accessToken: string) => {
      if (redirected) return;
      redirected = true;

      let redirectPath = `/${locale}`;

      if (forceOnboarding) {
        redirectPath = `/${locale}/onboarding`;
      } else {
        try {
          // Supabase REST API로 프로필 직접 조회 (클라이언트 lock 우회)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          const res = await fetch(
            `${supabaseUrl}/rest/v1/kcl_user_profiles?id=eq.${userId}&select=favorite_group_id`,
            {
              headers: {
                'apikey': supabaseKey || '',
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
              },
            }
          );
          if (res.ok) {
            const rows = await res.json();
            if (!rows?.[0]?.favorite_group_id) {
              redirectPath = `/${locale}/onboarding`;
            }
          }
        } catch {
          // 프로필 조회 실패 시 홈으로 이동
        }
      }

      // 로그인 성공 시 마지막 프로바이더 localStorage 저장
      const provider = getProviderFromSession();
      if (provider) {
        saveLastProvider(provider);
      }

      // window.location으로 확실한 full-page 네비게이션
      window.location.href = redirectPath;
    };

    // 1) exchangeCodeForSession fire-and-forget (await 안 함)
    //    Supabase 내부 navigator.locks 때문에 Promise가 무한 대기할 수 있으므로 절대 await 금지
    //    모듈 레벨 exchangingCode로 React Strict Mode 중복 호출 방지 (PKCE 코드 일회용)
    if (exchangingCode !== code) {
      exchangingCode = code;
      supabase.auth.exchangeCodeForSession(code).catch((err) => {
        console.warn('[OAuth Callback] 코드 교환 예외:', err);
      });
    }

    // 2) localStorage 폴링으로 세션 토큰 감지 (Supabase lock 우회)
    //    Supabase가 PKCE 교환 성공 시 localStorage에 세션을 저장하므로
    //    이를 직접 읽어서 리다이렉트를 트리거합니다.
    //    Strict Mode 두 번째 mount에서도 폴링이 정상 시작됩니다.
    const pollInterval = setInterval(() => {
      if (redirected) return;
      const session = getSessionFromStorage();
      if (session) {
        clearInterval(pollInterval);
        resolveAndRedirect(session.userId, session.accessToken);
      }
    }, 300);

    // 3) 최종 안전망: 15초 후에도 리다이렉트 안 됐으면 타임아웃
    const timeoutId = setTimeout(() => {
      if (!redirected) {
        clearInterval(pollInterval);
        setError(t('error_oauth_timeout'));
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [searchParams, pathname, t]);

  // 에러 상태 UI
  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>:(</div>
        <p style={{
          color: 'var(--color-text-dim)',
          fontSize: '0.9rem',
          maxWidth: '400px',
          lineHeight: 1.5,
        }}>
          {error}
        </p>
        <button
          type="button"
          onClick={() => {
            const locale = pathname.split('/')[1] || 'en';
            window.location.href = `/${locale}`;
          }}
          style={{
            marginTop: '8px',
            padding: '10px 24px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {t('go_home')}
        </button>
      </div>
    );
  }

  // 로딩 상태 UI
  return <LoadingSpinner />;
}

/** 로딩 스피너 공통 컴포넌트 */
function LoadingSpinner() {
  const t = useTranslations('Auth');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '16px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary, #8B5CF6)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
        {t('callback_loading')}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/**
 * CallbackClient 메인 컴포넌트
 * Suspense로 useSearchParams() 래핑 (Next.js 정적 빌드 요구사항)
 */
export default function CallbackClient() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackHandler />
    </Suspense>
  );
}
