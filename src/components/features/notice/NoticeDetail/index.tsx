'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Announcement } from '@/types/announcement';
import styles from './NoticeDetail.module.scss';

interface NoticeDetailProps {
  notice: Announcement;
  loading: boolean;
  onBack: () => void;
}

/**
 * 공지사항 상세보기 컴포넌트
 * 관리자가 작성한 HTML 콘텐츠를 렌더링
 */
export default function NoticeDetail({ notice, loading, onBack }: NoticeDetailProps) {
  const t = useTranslations('Notice');

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>{t('loading')}</p>
      </div>
    );
  }

  /** 날짜 포맷팅 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA');
  };

  return (
    <div className={styles.noticeDetail}>
      {/* 상단 네비게이션 */}
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeft size={16} />
        <span>{t('back_to_list')}</span>
      </button>

      {/* 공지 헤더 */}
      <div className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{notice.title}</h2>
        <div className={styles.detailMeta}>
          <span>{formatDate(notice.created_at)}</span>
          <span>{t('views', { count: notice.view_count })}</span>
        </div>
      </div>

      {/* 본문 (Quill HTML 콘텐츠) */}
      <div
        className={`${styles.detailContent} ql-editor`}
        dangerouslySetInnerHTML={{
          __html: notice.content,
        }}
      />
    </div>
  );
}
