"use client";

/**
 * SignupForm - KCL 회원가입 폼 컴포넌트
 *
 * OAuth(Google/Kakao) + 이메일/비밀번호 회원가입을 지원합니다.
 * 정적 빌드 호환을 위해 모든 인증은 클라이언트 사이드에서 처리됩니다.
 *
 * 구조:
 * [Google로 시작하기] ← 메인 (원클릭)
 * [Kakao로 시작하기] ← 보조
 * ─── 또는 ───
 * [이메일] [사용자이름] [비밀번호] [가입하기]
 * 약관 동의 문구
 * [이미 계정이 있으신가요? 로그인]
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import styles from './SignupForm.module.scss';
import classNames from 'classnames';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/** 비밀번호 강도 계산 (0: 약함, 1: 보통, 2: 강함) */
function getPasswordStrength(password: string): number {
  if (!password || password.length < 8) return 0;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasLetter && hasNumber && hasSpecial && password.length >= 12) return 2;
  if (hasLetter && hasNumber) return 1;
  return 0;
}

/** 회원가입 유효성 검사 스키마 */
const schema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string()
    .min(8)
    .regex(/[a-zA-Z]/, 'Must contain a letter')
    .regex(/\d/, 'Must contain a number'),
});

type FormData = z.infer<typeof schema>;

export default function SignupForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const emailValue = watch('email');
  const usernameValue = watch('username');
  const passwordValue = watch('password');

  /**
   * OAuth 회원가입 처리 (Google / Kakao)
   * 로그인과 동일한 PKCE 플로우 사용 (OAuth는 가입/로그인 동시 처리)
   */
  const handleOAuthSignup = async (provider: 'google' | 'kakao') => {
    setOauthLoading(provider);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setOauthLoading(null);
      }
    } catch {
      setError(t('error_generic'));
      setOauthLoading(null);
    }
  };

  /**
   * 이메일/비밀번호 회원가입 처리
   */
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(`/${locale}/login`);
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
          <svg className={styles.oauthIcon} viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>{oauthLoading === 'google' ? t('logging_in') : t('google_login')}</span>
        </button>

        {/* Kakao 가입 버튼 */}
        <button
          type="button"
          className={classNames(styles.oauthBtn, styles.kakaoBtn)}
          onClick={() => handleOAuthSignup('kakao')}
          disabled={!!oauthLoading}
        >
          <svg className={styles.oauthIcon} viewBox="0 0 24 24" width="20" height="20">
            <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.1a.3.3 0 0 0 .45.34l4.78-3.18c.49.06.99.1 1.51.1 5.52 0 10-3.36 10-7.6C22 6.36 17.52 3 12 3z" fill="#3C1E1E"/>
          </svg>
          <span>{oauthLoading === 'kakao' ? t('logging_in') : t('kakao_login')}</span>
        </button>
      </div>

      {/* 구분선 */}
      <div className={styles.separator}>
        <span>{t('or_divider')}</span>
      </div>

      {/* 이메일/비밀번호 가입 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* 이메일 입력 */}
        <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!emailValue })}>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className={styles.input}
          />
          <label className={styles.floatingLabel}>{t('email_placeholder')}</label>
        </div>
        {errors.email && <p className={styles.errorMsg}>{t('error_email_invalid')}</p>}

        {/* 사용자 이름 입력 */}
        <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!usernameValue })}>
          <input
            {...register('username')}
            type="text"
            autoComplete="username"
            className={styles.input}
          />
          <label className={styles.floatingLabel}>{t('username_placeholder')}</label>
        </div>
        {errors.username && <p className={styles.errorMsg}>{t('error_username_min')}</p>}

        {/* 비밀번호 입력 */}
        <div className={classNames(styles.inputGroup, { [styles.hasValue]: !!passwordValue })}>
          <input
            {...register('password')}
            type="password"
            autoComplete="new-password"
            className={styles.input}
          />
          <label className={styles.floatingLabel}>{t('password_placeholder')}</label>
        </div>
        {errors.password && (
          <p className={styles.errorMsg}>
            {errors.password.message?.includes('letter')
              ? t('error_password_letter')
              : errors.password.message?.includes('number')
                ? t('error_password_number')
                : t('error_password_min')}
          </p>
        )}

        {/* 비밀번호 강도 인디케이터 */}
        {passwordValue && !errors.password && (
          <div className={styles.strengthBar}>
            <div className={styles.strengthTrack}>
              {[0, 1, 2].map((level) => (
                <div
                  key={level}
                  className={classNames(styles.strengthSegment, {
                    [styles.weak]: getPasswordStrength(passwordValue) >= 0 && level === 0,
                    [styles.medium]: getPasswordStrength(passwordValue) >= 1 && level <= 1,
                    [styles.strong]: getPasswordStrength(passwordValue) >= 2,
                  })}
                />
              ))}
            </div>
            <span className={styles.strengthLabel}>
              {getPasswordStrength(passwordValue) === 0
                ? t('password_weak')
                : getPasswordStrength(passwordValue) === 1
                  ? t('password_medium')
                  : t('password_strong')}
            </span>
          </div>
        )}

        {/* 서버 에러 메시지 */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* 약관 동의 문구 */}
        <p className={styles.disclaimer}>{t('signup_terms')}</p>

        {/* 가입하기 버튼 */}
        <button type="submit" className={styles.loginBtn} disabled={loading}>
          {loading ? t('signing_up') : t('signup_button')}
        </button>
      </form>

      {/* 로그인 안내 */}
      <div className={styles.loginPrompt}>
        <span>{t('has_account')}</span>
        <Link href={`/${locale}/login`} className={styles.loginLink}>
          {t('login_button')}
        </Link>
      </div>
    </div>
  );
}
