'use client';

/**
 * BottomNav - 모바일 하단 네비게이션 컴포넌트
 *
 * 모바일(<768px)에서만 표시되는 하단 고정 네비게이션입니다.
 * Sidebar와 동기화된 메뉴를 표시하며,
 * AUTH_SYSTEM 활성화 시 프로필/로그인 아이콘을 추가합니다.
 *
 * Framer Motion으로 활성 상태 인디케이터 애니메이션 적용.
 */

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, BarChart3, Trophy, Newspaper, Bell, User, Mail, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { useState, useCallback } from 'react';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';
import styles from './BottomNav.module.scss';

export default function BottomNav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  // 현재 locale 추출 (예: /en/ranking -> 'en')
  const currentLocale = pathname.split('/')[1] || 'en';
  const { isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleContactClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText('mun01183@gmail.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.location.href = 'mailto:mun01183@gmail.com';
    }
  }, []);

  // Feature Flags 기반 네비게이션 메뉴 (Sidebar와 동기화)
  const NAV_ITEMS = [
    { label: t('home'), href: '/', icon: Home, enabled: true },
    {
      label: t('analytics'),
      href: '/analytics',
      icon: BarChart3,
      enabled: FEATURES.ANALYTICS_PAGE,
    },
    {
      label: t('hall_of_fame'),
      href: '/hall-of-fame',
      icon: Trophy,
      enabled: FEATURES.HALL_OF_FAME_PAGE,
    },
    { label: t('news'), href: '/news', icon: Newspaper, enabled: FEATURES.NEWS_PAGE },
    {
      label: t('notice'),
      href: '/notice',
      icon: Bell,
      enabled: FEATURES.NOTICE_PAGE,
    },
    // AUTH_SYSTEM 활성화 시 프로필/로그인 아이콘 추가
    ...(FEATURES.AUTH_SYSTEM
      ? [
          // 로그인 회원에게만 문의하기 표시
          ...(isAuthenticated
            ? [
                {
                  label: copied ? t('contact_copied') : t('contact'),
                  href: '#contact',
                  icon: copied ? Check : Mail,
                  enabled: true,
                  isContact: true,
                },
              ]
            : []),
          {
            label: isAuthenticated ? t('my') : t('login'),
            href: isAuthenticated ? '/my' : '/login',
            icon: User,
            enabled: true,
          },
        ]
      : []),
  ].filter((item) => item.enabled);

  return (
    <nav className={styles.navContainer}>
      <div className={styles.navGlass}>
        {NAV_ITEMS.map((item) => {
          const isContact = 'isContact' in item && item.isContact;
          const isExternal = 'isExternal' in item && (item as {isExternal?: boolean}).isExternal;
          const linkHref = isContact || isExternal
            ? item.href
            : `/${currentLocale}${item.href === '/' ? '' : item.href}`;
          const isActive = isContact || isExternal
            ? false
            : item.href === '/'
              ? pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`
              : pathname.startsWith(linkHref);

          const Icon = item.icon;

          if (isContact) {
            return (
              <button
                key={item.href}
                onClick={handleContactClick}
                className={classNames(styles.navItem, { [styles.active]: copied })}
              >
                <div className={styles.iconWrapper}>
                  <Icon size={24} strokeWidth={2} />
                </div>
                <span className={styles.label}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={linkHref}
              className={classNames(styles.navItem, { [styles.active]: isActive })}
            >
              <div className={styles.iconWrapper}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={styles.indicator}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
