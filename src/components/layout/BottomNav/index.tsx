'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home, BarChart3, Trophy, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import classNames from 'classnames';
import styles from './BottomNav.module.scss';

export default function BottomNav() {
  const t = useTranslations('Nav');
  const pathname = usePathname();
  // 현재 locale 추출 (예: /en/ranking -> 'en')
  const currentLocale = pathname.split('/')[1] || 'en';

  const NAV_ITEMS = [
    { label: t('home'), href: '/', icon: Home },
    { label: t('analytics'), href: '/analytics', icon: BarChart3 },
    { label: t('hall_of_fame'), href: '/hall-of-fame', icon: Trophy },
    { label: t('news'), href: '/news', icon: Newspaper },
    // { label: 'Ranking', href: '/ranking', icon: Trophy },
    // { label: 'Support', href: '/support', icon: HeartHandshake }, // Vote -> Support Mapping
    // { label: 'My', href: '/my', icon: User },
  ];

  return (
    <nav className={styles.navContainer}>
      <div className={styles.navGlass}>
        {NAV_ITEMS.map((item) => {
          // 경로 생성: /en + /ranking
          const linkHref = `/${currentLocale}${item.href === '/' ? '' : item.href}`;
          // Home('/')일 경우 정확히 일치, 그 외에는 포함 여부 (간단한 isActive 로직)
          const isActive =
            item.href === '/'
              ? pathname === `/${currentLocale}` || pathname === `/${currentLocale}/`
              : pathname.startsWith(linkHref);

          const Icon = item.icon;

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
