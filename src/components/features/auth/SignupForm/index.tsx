"use client";

/**
 * SignupForm - MEARROW 회원가입 폼 컴포넌트
 *
 * OAuth(Google/Kakao) 회원가입만 지원합니다.
 * 정적 빌드 호환을 위해 모든 인증은 클라이언트 사이드에서 처리됩니다.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import styles from './SignupForm.module.scss';
import classNames from 'classnames';
import { createClient } from '@/lib/supabase/client';
import { FEATURES } from '@/config/features';

export default function SignupForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  /**
   * OAuth 회원가입 처리 (Google / Kakao)
   * flow=signup은 가입 진입 의도를 전달하지만, 콜백은 서버 프로필을 확인해
   * 미완료 사용자만 온보딩으로 보냅니다.
   */
  const handleOAuthSignup = async (provider: 'google' | 'kakao') => {
    setOauthLoading(provider);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?flow=signup`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setError(t('error_oauth_generic'));
        setOauthLoading(null);
      }
    } catch {
      setError(t('error_generic'));
      setOauthLoading(null);
    }
  };

  return (
    <div className={styles.formWrapper}>
      {/* 안내 문구 */}
      <p className={styles.subtitle}>{t('signup_subtitle')}</p>

      {/* OAuth 버튼 영역 */}
      <div className={styles.oauthSection}>
        {/* Google 가입 버튼 */}
        <button
          type="button"
          className={classNames(styles.oauthBtn, styles.googleBtn)}
          onClick={() => handleOAuthSignup('google')}
          disabled={!!oauthLoading}
        >
          <svg
            className={styles.oauthIcon}
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>{oauthLoading === 'google' ? t('logging_in') : t('google_login')}</span>
        </button>

        {/* Kakao 가입 버튼 (KAKAO_LOGIN 플래그로 제어) */}
        {FEATURES.KAKAO_LOGIN && (
          <button
            type="button"
            className={classNames(styles.oauthBtn, styles.kakaoBtn)}
            onClick={() => handleOAuthSignup('kakao')}
            disabled={!!oauthLoading}
          >
            <svg
              className={styles.oauthIcon}
              viewBox="0 0 24 24"
              width="20"
              height="20"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.1a.3.3 0 0 0 .45.34l4.78-3.18c.49.06.99.1 1.51.1 5.52 0 10-3.36 10-7.6C22 6.36 17.52 3 12 3z" fill="#3C1E1E" />
            </svg>
            <span>{oauthLoading === 'kakao' ? t('logging_in') : t('kakao_login')}</span>
          </button>
        )}
      </div>

      {/* 서버 에러 메시지 */}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* 약관 동의 문구 */}
      <p className={styles.disclaimer}>{t('signup_terms')}</p>

      {/* 이메일 회원가입 준비중 안내 */}
      <p className={styles.comingSoonNotice}>{t('email_signup_coming_soon')}</p>
    </div>
  );
}
