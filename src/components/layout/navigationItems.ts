import type { LucideIcon } from 'lucide-react';
import { CalendarSearch, Home, ListOrdered, Newspaper, Trophy } from 'lucide-react';
import { isFeatureEnabled, type FeatureKey } from '@/config/features';

export type PrimaryNavigationLabelKey =
  | 'home'
  | 'ranking'
  | 'hall_of_fame'
  | 'news'
  | 'auditions';

export type PrimaryNavigationItem = {
  id: PrimaryNavigationLabelKey;
  labelKey: PrimaryNavigationLabelKey;
  path: string;
  icon: LucideIcon;
  feature?: FeatureKey;
};

export const PRIMARY_NAV_ITEMS: readonly PrimaryNavigationItem[] = [
  { id: 'home', labelKey: 'home', path: '/', icon: Home },
  { id: 'ranking', labelKey: 'ranking', path: '/ranking', icon: ListOrdered },
  {
    id: 'hall_of_fame',
    labelKey: 'hall_of_fame',
    path: '/hall-of-fame',
    icon: Trophy,
    feature: 'HALL_OF_FAME_PAGE',
  },
  { id: 'news', labelKey: 'news', path: '/news', icon: Newspaper, feature: 'NEWS_PAGE' },
  {
    id: 'auditions',
    labelKey: 'auditions',
    path: '/auditions',
    icon: CalendarSearch,
    feature: 'AUDITIONS_PAGE',
  },
];

export function getEnabledPrimaryNavItems(): PrimaryNavigationItem[] {
  return PRIMARY_NAV_ITEMS.filter((item) => !item.feature || isFeatureEnabled(item.feature));
}
