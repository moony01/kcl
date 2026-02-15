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
 * 2. 클라이언트에서 supabase.auth.exchangeCodeForSession(code) 호출
 * 3. 성공 → 홈으로 이동 / 실패 → 에러 표시
 */

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getSupabase } from '@/lib/supabase/client';

/**
 * 콜백 처리 내부 컴포넌트 (Suspense 바운더리 내에서 useSearchParams 사용)
 *
 * @supabase/ssr의 createBrowserClient는 detectSessionInUrl이 기본 활성화되어
 * URL의 ?code= 파라미터를 자동으로 감지하여 PKCE 세션 교환을 수행합니다.
 * 따라서 수동으로 exchangeCodeForSession을 호출할 필요 없이,
 * onAuthStateChange 이벤트를 감지하여 리다이렉트합니다.
 */
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // OAuth 에러 파라미터가 있는 경우 (XSS 방지: 화이트리스트 방식)
    if (errorParam) {
      // raw 에러는 콘솔에만 기록 (디버깅용)
      if (errorDescription) {
        console.error('[OAuth Callback] Error:', errorParam, errorDescription);
      }
      // 사전 정의된 에러 코드만 매핑, 나머지는 기본 메시지
      const errorMessages: Record<string, string> = {
        'access_denied': 'Access denied. Please try again.',
        'server_error': 'Server error occurred. Please try again later.',
        'temporarily_unavailable': 'Service temporarily unavailable. Please try again later.',
        'invalid_request': 'Invalid request. Please try again.',
        'unauthorized_client': 'Authorization failed. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
      return;
    }

    const supabase = getSupabase();

    // Supabase 클라이언트가 URL의 code를 자동으로 감지하여 세션을 교환합니다.
    // onAuthStateChange 리스너로 세션 확립을 감지하고 홈으로 이동합니다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 현재 경로에서 로케일 추출 (예: /ko/auth/callback → ko)
        const locale = pathname.split('/')[1] || 'en';
        router.replace(`/${locale}`);
      }
    });

    // 이미 세션이 있는 경우 (이전에 자동 교환이 완료된 경우)를 위한 폴백
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const locale = pathname.split('/')[1] || 'en';
        router.replace(`/${locale}`);
      }
    };

    // 약간의 딜레이 후 세션 확인 (자동 교환이 먼저 완료될 시간 확보)
    const timer = setTimeout(checkExistingSession, 1000);

    // 타임아웃: 10초 후에도 세션이 없으면 에러 표시
    const errorTimer = setTimeout(() => {
      setError('Authentication timed out. Please try again.');
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
      clearTimeout(errorTimer);
    };
  }, [searchParams, router, pathname]);

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
          onClick={() => {
            const locale = pathname.split('/')[1] || 'en';
            router.replace(`/${locale}`);
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
          Go Home
        </button>
      </div>
    );
  }

  // 로딩 상태 UI
  return <LoadingSpinner />;
}

/** 로딩 스피너 공통 컴포넌트 */
function LoadingSpinner() {
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
        Signing in...
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
