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
import { User, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import { FEATURES } from '@/config/features';
import { useAuth } from '@/hooks/useAuth';
import { getEnabledPrimaryNavItems } from '@/components/layout/navigationItems';
import styles from './BottomNav.module.scss';

type BottomNavItem = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
};

export default function BottomNav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  // 현재 locale 추출 (예: /en/ranking -> 'en')
  const currentLocale = pathname.split('/')[1] || 'en';
  const { isAuthenticated } = useAuth();

  const navItems: BottomNavItem[] = getEnabledPrimaryNavItems().map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    path: item.path,
    icon: item.icon,
  }));

  // AUTH_SYSTEM 활성화 시 프로필/로그인 아이콘 추가
  if (FEATURES.AUTH_SYSTEM) {
    navItems.push({
      id: 'auth',
      label: isAuthenticated ? t('my') : t('login'),
      path: isAuthenticated ? '/my' : '/login',
      icon: User,
    });
  }

  return (
    <nav className={styles.navContainer} data-testid="mobile-bottom-nav">
      <div className={styles.navGlass}>
        {navItems.map((item) => {
          const linkHref = `/${currentLocale}${item.path === '/' ? '' : item.path}`;
          const isActive = item.path === '/'
              ? pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`
              : pathname === linkHref || pathname.startsWith(`${linkHref}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={linkHref}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
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
