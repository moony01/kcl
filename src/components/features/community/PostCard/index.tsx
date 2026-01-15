'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Eye, MessageCircle } from 'lucide-react';
import type { Post } from '@/types/community';
import styles from './PostCard.module.scss';

/**
 * PostCard Props
 */
interface PostCardProps {
  /** 게시글 데이터 */
  post: Post;
  /** 현재 locale */
  locale: string;
}

/**
 * 모바일용 게시글 카드 컴포넌트
 * 제목, 작성자, 작성일, 댓글수, 조회수 표시
 */
export default function PostCard({ post, locale }: PostCardProps) {
  // 현재 번역 키 사용하지 않지만, 향후 확장성을 위해 유지
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _t = useTranslations('Community');

  /** 날짜 포맷 */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffTime / (1000 * 60));
        return `${diffMins}m`;
      }
      return `${diffHours}h`;
    }
    if (diffDays < 7) {
      return `${diffDays}d`;
    }
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/${locale}/community/${post.id}`} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{post.title}</h3>
      </div>

      <div className={styles.meta}>
        <span className={styles.author}>{post.nickname}</span>
        <span className={styles.separator}>·</span>
        <span className={styles.date}>{formatDate(post.created_at)}</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <Eye size={14} />
          <span>{post.view_count}</span>
        </div>
        <div className={styles.stat}>
          <MessageCircle size={14} />
          <span>{post.comment_count}</span>
        </div>
      </div>
    </Link>
  );
}
