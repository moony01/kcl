'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, BarChart3, Trophy, Newspaper, Bell } from 'lucide-react';
import classNames from 'classnames';
import { FEATURES } from '@/config/features';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ko';

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    return pathname?.startsWith(`/${locale}${path}`);
  };

  // Feature Flags 기반 네비게이션 메뉴
  const navItems = [
    { label: t('home'), icon: Home, path: '/', enabled: true },
    {
      label: t('analytics'),
      icon: BarChart3,
      path: '/analytics',
      enabled: FEATURES.ANALYTICS_PAGE,
    },
    {
      label: t('hall_of_fame'),
      icon: Trophy,
      path: '/hall-of-fame',
      enabled: FEATURES.HALL_OF_FAME_PAGE,
    },
    { label: t('news'), icon: Newspaper, path: '/news', enabled: FEATURES.NEWS_PAGE },
    {
      label: t('notice'),
      icon: Bell,
      path: '/notice',
      enabled: FEATURES.NOTICE_PAGE,
    },
  ].filter((item) => item.enabled);

  return (
    <aside className={styles.sidebar}>
      {/* Logo Area */}
      <div className={styles.logoArea}>
        <Link href={`/${locale}`} className={styles.brand}>
          <div className={styles.logoWrapper}>
            <img src="/kcl-logo.svg" alt="KCL" className={styles.logoImage} />
          </div>
          <span className={styles.logoText}>KCL</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={`/${locale}${item.path === '/' ? '' : item.path}`}
            className={classNames(styles.navItem, { [styles.active]: isActive(item.path) })}
          >
            <div className={styles.iconWrapper}>
              <item.icon className={styles.icon} />
            </div>
            <span className={styles.label}>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
