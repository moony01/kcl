'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import type { Post } from '@/types/community';
import PostCard from '../PostCard';
import styles from './PostList.module.scss';

/**
 * PostList Props
 */
interface PostListProps {
  /** 게시글 목록 */
  posts: Post[];
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 게시글 목록 컴포넌트
 * - 데스크톱: 테이블 형태
 * - 모바일: 카드 형태
 */
export default function PostList({ posts, isLoading = false }: PostListProps) {
  const t = useTranslations('Community');
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'ko';

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

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeletonRow}>
              <div className={styles.skeletonNumber} />
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMeta} />
              <div className={styles.skeletonMeta} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 빈 상태
  if (posts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <FileText size={48} className={styles.emptyIcon} />
          <p className={styles.emptyText}>{t('no_posts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 데스크톱 테이블 */}
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            <th className={styles.th}>{t('table.number')}</th>
            <th className={styles.th}>{t('table.title')}</th>
            <th className={styles.th}>{t('table.author')}</th>
            <th className={styles.th}>{t('table.date')}</th>
            <th className={styles.th}>{t('table.views')}</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, index) => (
            <tr key={post.id} className={styles.tableRow}>
              <td className={styles.td}>{posts.length - index}</td>
              <td className={styles.td}>
                <div className={styles.titleCell}>
                  <Link href={`/${locale}/community/${post.id}`} className={styles.postTitle}>
                    {post.title}
                  </Link>
                  {post.comment_count > 0 && (
                    <span className={styles.commentBadge}>[{post.comment_count}]</span>
                  )}
                </div>
              </td>
              <td className={styles.td}>{post.nickname}</td>
              <td className={styles.td}>{formatDate(post.created_at)}</td>
              <td className={styles.td}>{post.view_count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 모바일 카드 리스트 */}
      <div className={styles.cardList}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </div>
  );
}
