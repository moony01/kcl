'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, BarChart3, Trophy, Newspaper } from 'lucide-react';
import styles from './Sidebar.module.scss';
import classNames from 'classnames';

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

  const navItems = [
    { label: t('home'), icon: Home, path: '/' },
    { label: t('analytics'), icon: BarChart3, path: '/analytics' },
    { label: t('hall_of_fame'), icon: Trophy, path: '/hall-of-fame' },
    { label: t('news'), icon: Newspaper, path: '/news' },
    // { label: t('ranking'), icon: Trophy, path: '/ranking' },
    // { label: '게시판', icon: MessageSquare, path: '/community' },
    // { label: '만들기', icon: PlusSquare, path: '#' },
    /*
    { 
      label: t('my'), 
      icon: UserCircle, 
      path: isLoggedIn ? '/profile' : '/login' 
    },
    */
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Logo Area */}
      <div className={styles.logoArea}>
        <div className={styles.kclLogo}>KCL</div>
        <div className={styles.kclIconLogo}>K</div>
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
