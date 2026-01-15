'use client';

import { useTranslations } from 'next-intl';
import { User, Calendar, Eye, Flag } from 'lucide-react';
import type { Post } from '@/types/community';
import styles from './PostDetail.module.scss';

/**
 * PostDetail Props
 */
interface PostDetailProps {
  /** 게시글 데이터 */
  post: Post;
  /** 신고 버튼 클릭 핸들러 */
  onReport?: () => void;
}

/**
 * 게시글 상세 컴포넌트
 * 메타 정보, 본문, 신고 버튼 표시
 */
export default function PostDetail({ post, onReport }: PostDetailProps) {
  const t = useTranslations('Community');

  /** 날짜 포맷 */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <article className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <User size={16} />
            <span>{post.nickname}</span>
          </div>
          <div className={styles.metaItem}>
            <Calendar size={16} />
            <span>{formatDate(post.created_at)}</span>
          </div>
          <div className={styles.metaItem}>
            <Eye size={16} />
            <span>{post.view_count}</span>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className={styles.content}>
        <p className={styles.body}>{post.content}</p>
      </div>

      {/* 액션 영역 */}
      <div className={styles.actions}>
        <button type="button" className={styles.reportBtn} onClick={onReport}>
          <Flag size={16} />
          <span>{t('detail.report')}</span>
        </button>
      </div>
    </article>
  );
}
