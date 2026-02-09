'use client';

import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import type { AnnouncementCategory } from '@/types/announcement';
import styles from './CategoryFilter.module.scss';

interface CategoryFilterProps {
  selected?: AnnouncementCategory;
  onChange: (category?: AnnouncementCategory) => void;
}

/** 카테고리 필터 옵션 */
const CATEGORIES: (AnnouncementCategory | undefined)[] = [
  undefined, // 전체
  'notice',
  'update',
  'event',
];

/**
 * 공지사항 카테고리 필터 컴포넌트
 * 탭 형태의 필터 UI
 */
export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const t = useTranslations('Notice');

  /** 카테고리 라벨 매핑 */
  const getLabel = (category?: AnnouncementCategory) => {
    if (!category) return t('category_all');
    const labels: Record<string, string> = {
      notice: t('category_notice'),
      update: t('category_update'),
      event: t('category_event'),
    };
    return labels[category];
  };

  return (
    <div className={styles.categoryFilter}>
      {CATEGORIES.map((category) => (
        <button
          key={category || 'all'}
          className={classNames(styles.filterButton, {
            [styles.active]: selected === category,
          })}
          onClick={() => onChange(category)}
        >
          {getLabel(category)}
        </button>
      ))}
    </div>
  );
}
