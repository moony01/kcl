'use client';

import { Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import type { AnnouncementListItem } from '@/types/announcement';
import styles from './NoticeList.module.scss';

interface NoticeListProps {
  notices: AnnouncementListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

/**
 * 공지사항 목록 컴포넌트
 * 클릭 시 상세보기를 인라인으로 펼침
 */
export default function NoticeList({ notices, selectedId, onSelect }: NoticeListProps) {
  const t = useTranslations('Notice');

  /** 카테고리 라벨 매핑 */
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      notice: t('category_notice'),
      update: t('category_update'),
      event: t('category_event'),
    };
    return labels[category] || category;
  };

  /** 날짜 포맷팅 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD 형식
  };

  return (
    <div className={styles.noticeList}>
      {notices.map((notice) => (
        <button
          key={notice.id}
          className={classNames(styles.noticeItem, {
            [styles.selected]: selectedId === notice.id,
            [styles.pinned]: notice.is_pinned,
          })}
          onClick={() => onSelect(notice.id)}
        >
          <div className={styles.itemHeader}>
            {notice.is_pinned && (
              <span className={styles.pinnedBadge}>
                <Pin size={12} />
                {t('pinned')}
              </span>
            )}
            <span className={classNames(styles.categoryBadge, styles[notice.category])}>
              {getCategoryLabel(notice.category)}
            </span>
          </div>
          <h3 className={styles.itemTitle}>{notice.title}</h3>
          <div className={styles.itemMeta}>
            <span>{formatDate(notice.created_at)}</span>
            <span>{t('views', { count: notice.view_count })}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
