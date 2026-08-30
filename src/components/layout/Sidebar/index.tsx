'use client';

/**
 * Sidebar - 데스크탑 좌측 네비게이션 컴포넌트
 *
 * 인스타그램 스타일의 좌측 고정 네비게이션입니다.
 * Feature Flags에 따라 메뉴를 동적으로 표시하며,
 * AUTH_SYSTEM 활성화 시 하단에 인증 영역을 표시합니다.
 *
 * 반응형:
 * - Mobile(<480px): 숨김
 * - Fold/Tablet(480px-1263px): 기본 아이콘 레일, hover/focus-within 시 확장
 * - Desktop(1264px+): 아이콘 + 레이블 고정
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarSearch,
  Check,
  Home,
  LogIn,
  LogOut,
  ListOrdered,
  Mail,
  Newspaper,
  Trophy,
} from 'lucide-react';
import classNames from 'classnames';
import { useState, useCallback } from 'react';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';
import { BRAND_KOREAN_NAME, BRAND_NAME, BRAND_MARK_PATH } from '@/lib/brand';
import styles from './Sidebar.module.scss';

const CONTACT_EMAIL = '';

export default function Sidebar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ko';
  const { profile, isAuthenticated, signOut } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleContactClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    const localizedPath = `/${locale}${path}`;
    return pathname === localizedPath || pathname?.startsWith(`${localizedPath}/`);
  };

  // Feature Flags 기반 네비게이션 메뉴
  const navItems = [
    { label: t('home'), icon: Home, path: '/', enabled: true },
    { label: t('ranking'), icon: ListOrdered, path: '/ranking', enabled: true },
    {
      label: t('hall_of_fame'),
      icon: Trophy,
      path: '/hall-of-fame',
      enabled: FEATURES.HALL_OF_FAME_PAGE,
    },
    { label: t('news'), icon: Newspaper, path: '/news', enabled: FEATURES.NEWS_PAGE },
    {
      label: t('auditions'),
      icon: CalendarSearch,
      path: '/auditions',
      enabled: FEATURES.AUDITIONS_PAGE,
    },
  ].filter((item) => item.enabled);

  return (
    <aside className={styles.sidebar} aria-label="주요 메뉴">
      {/* Logo Area */}
      <div className={styles.logoArea}>
        <Link
          href={`/${locale}`}
          className={styles.brand}
          aria-label={`${BRAND_NAME} (${BRAND_KOREAN_NAME}) 홈`}
        >
          <div className={styles.logoWrapper}>
            <img
              src={BRAND_MARK_PATH}
              alt=""
              className={styles.logoImage}
              width={40}
              height={40}
            />
          </div>
          <span className={styles.logoText}>{BRAND_NAME}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="사이트 탐색">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={`/${locale}${item.path === '/' ? '' : item.path}`}
            className={classNames(styles.navItem, { [styles.active]: isActive(item.path) })}
            aria-label={item.label}
          >
            <div className={styles.iconWrapper}>
              <item.icon className={styles.icon} />
            </div>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* 인증 영역 (AUTH_SYSTEM 플래그 활성화 시 표시) */}
      {FEATURES.AUTH_SYSTEM && (
        <div className={styles.authSection}>
          {isAuthenticated ? (
            <>
              {/* 문의하기 (로그인 회원에게만 표시) */}
              <button
                onClick={handleContactClick}
                className={classNames(styles.navItem, styles.contactBtn, {
                  [styles.contactCopied]: copied,
                })}
                aria-label={copied ? t('contact_copied') : t('contact')}
                title={copied ? CONTACT_EMAIL : t('contact')}
              >
                <div className={styles.iconWrapper}>
                  {copied ? (
                    <Check className={styles.icon} />
                  ) : (
                    <Mail className={styles.icon} />
                  )}
                </div>
                <span className={styles.label}>
                  {copied ? t('contact_copied') : t('contact')}
                </span>
              </button>

              {/* 프로필 정보 */}
              <Link
                href={`/${locale}/my`}
                className={classNames(styles.navItem, styles.profileItem)}
                aria-label={profile?.username || t('my')}
              >
                <div className={styles.iconWrapper}>
                  <span className={styles.avatarInitial}>
                    {(profile?.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={styles.label}>{profile?.username || t('my')}</span>
              </Link>

              {/* 로그아웃 버튼 */}
              <button
                onClick={signOut}
                className={classNames(styles.navItem, styles.logoutBtn)}
                aria-label={t('logout')}
              >
                <div className={styles.iconWrapper}>
                  <LogOut className={styles.icon} />
                </div>
                <span className={styles.label}>{t('logout')}</span>
              </button>
            </>
          ) : (
            /* 로그인 버튼 */
            <Link
              href={`/${locale}/login`}
              className={classNames(styles.navItem, styles.loginBtn)}
              aria-label={t('login')}
            >
              <div className={styles.iconWrapper}>
                <LogIn className={styles.icon} />
              </div>
              <span className={styles.label}>{t('login')}</span>
            </Link>
          )}
        </div>
      )}
    </aside>
  );
}
