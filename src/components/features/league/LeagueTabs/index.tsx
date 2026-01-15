/**
 * LeagueTabs
 *
 * 1부/2부 리그 탭 네비게이션 컴포넌트
 * - Active 상태 스타일링 (언더라인 애니메이션)
 * - 뱃지로 소속사 수 표시
 * - 모바일 스와이프 지원 (선택)
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown, Flame } from 'lucide-react';
import classNames from 'classnames';
import type { LeagueTabType } from '@/types/league';
import styles from './LeagueTabs.module.scss';

interface LeagueTabsProps {
  /** 현재 활성 탭 */
  activeTab: LeagueTabType;
  /** 탭 변경 핸들러 */
  onTabChange: (tab: LeagueTabType) => void;
  /** 1부 리그 소속사 수 */
  premierCount: number;
  /** 2부 리그 소속사 수 */
  challengersCount: number;
}

export default function LeagueTabs({
  activeTab,
  onTabChange,
  premierCount,
  challengersCount,
}: LeagueTabsProps) {
  const t = useTranslations('League.tabs');

  const tabs = [
    {
      id: 'premier' as LeagueTabType,
      label: t('premier'),
      icon: Crown,
      count: premierCount,
      color: '#D4AF37', // Gold
    },
    {
      id: 'challengers' as LeagueTabType,
      label: t('challengers'),
      icon: Flame,
      count: challengersCount,
      color: '#C0C0C0', // Silver
    },
  ];

  return (
    <nav className={styles.tabsContainer}>
      <div className={styles.tabList}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              className={classNames(styles.tabButton, {
                [styles.active]: isActive,
                [styles.premier]: tab.id === 'premier',
                [styles.challengers]: tab.id === 'challengers',
              })}
              onClick={() => onTabChange(tab.id)}
              aria-selected={isActive}
              role="tab"
            >
              {/* 아이콘 */}
              <Icon
                size={18}
                className={styles.tabIcon}
                style={{ color: isActive ? tab.color : undefined }}
              />

              {/* 라벨 */}
              <span className={styles.tabLabel}>{tab.label}</span>

              {/* 뱃지 (소속사 수) */}
              <span className={styles.tabBadge}>{tab.count}</span>

              {/* Active 인디케이터 */}
              {isActive && (
                <motion.div
                  className={styles.indicator}
                  layoutId="leagueTabIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ background: tab.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 모바일 스와이프 힌트 */}
      <p className={styles.swipeHint}>{t('swipe_hint')}</p>
    </nav>
  );
}
