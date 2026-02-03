/**
 * CommunityClient (클라이언트 컴포넌트)
 *
 * 커뮤니티 목록 페이지 클라이언트 사이드 로직
 * CSR로 Supabase에서 게시글 목록을 fetch합니다.
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, PenSquare, RefreshCw, Info } from 'lucide-react';
import { PostList } from '@/components/features/community';
import { getPosts } from '@/lib/api/community';
import type { PostListItem } from '@/types/community';
import styles from './page.module.scss';

/**
 * CommunityClient Props
 */
interface CommunityClientProps {
  /** 현재 locale */
  locale: string;
}

/**
 * 커뮤니티 목록 클라이언트 컴포넌트
 * CSR로 게시글 목록을 불러옵니다.
 */
export default function CommunityClient({ locale }: CommunityClientProps) {
  const t = useTranslations('Community');

  // 상태 관리
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * 게시글 목록 fetch
   * @param pageNum - 페이지 번호
   * @param append - true면 기존 목록에 추가, false면 교체
   */
  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPosts({ page: pageNum, limit: 20 });

      if (append) {
        setPosts((prev) => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }

      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
      setPage(pageNum);
    } catch (err) {
      console.error('[CommunityClient] Failed to fetch posts:', err);
      setError(t('error.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // 초기 로드
  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  /** 새로고침 */
  const handleRefresh = () => {
    fetchPosts(1);
  };

  /** 더 보기 */
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchPosts(page + 1, true);
    }
  };

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <MessageSquare size={28} className={styles.icon} />
          {/* 페이지 레벨에서 sr-only h1이 있으므로 시각적 제목은 h2로 변경 */}
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* 글쓰기 임시 중단 안내 */}
      <div className={styles.noticeBox}>
        <Info size={18} className={styles.noticeIcon} />
        <p>{t('notice.write_disabled')}</p>
      </div>

      {/* 액션 바 */}
      <div className={styles.actionBar}>
        <div className={styles.leftActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label={t('refresh')}
          >
            <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
          </button>
          {totalCount > 0 && (
            <span className={styles.totalCount}>
              {t('total_posts', { count: totalCount })}
            </span>
          )}
        </div>
        {/* 글쓰기 버튼 비활성화 */}
        <button type="button" className={styles.writeBtnDisabled} disabled>
          <PenSquare size={18} />
          <span>{t('write')}</span>
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
          <button type="button" onClick={handleRefresh}>
            {t('retry')}
          </button>
        </div>
      )}

      {/* 게시글 목록 */}
      <PostList posts={posts} isLoading={isLoading && posts.length === 0} />

      {/* 더 보기 버튼 */}
      {hasMore && !isLoading && (
        <div className={styles.loadMoreWrapper}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={handleLoadMore}
          >
            {t('load_more')}
          </button>
        </div>
      )}

      {/* 로딩 중 (추가 로드) */}
      {isLoading && posts.length > 0 && (
        <div className={styles.loadingMore}>
          <RefreshCw size={20} className={styles.spinning} />
        </div>
      )}
    </main>
  );
}
