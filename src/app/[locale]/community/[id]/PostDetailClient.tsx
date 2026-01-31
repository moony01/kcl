/**
 * PostDetailClient (클라이언트 컴포넌트)
 *
 * 게시글 상세 페이지 클라이언트 사이드 로직
 * CSR로 Supabase에서 게시글 및 댓글을 fetch합니다.
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션 (Supabase 연동)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { PostDetail, CommentSection, ReportModal } from '@/components/features/community';
import { getPostById, createComment } from '@/lib/api/community';
import type { Post, Comment, CommentFormData } from '@/types/community';
import styles from './page.module.scss';

/**
 * 게시글 상세 클라이언트 컴포넌트
 */
export default function PostDetailClient() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('Community');
  const locale = (params.locale as string) || 'ko';
  const postId = params.id as string;

  // 상태 관리
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 신고 모달 상태
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
  } | null>(null);

  /**
   * 게시글 및 댓글 fetch
   */
  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPostById(postId);

      if (response.error || !response.post) {
        setError(response.error || t('error.post_not_found'));
        return;
      }

      setPost(response.post);
      setComments(response.comments);
    } catch (err) {
      console.error('[PostDetailClient] Failed to fetch post:', err);
      setError(t('error.load_failed'));
    } finally {
      setIsLoading(false);
    }
  }, [postId, t]);

  // 초기 로드
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  /** 댓글 추가 */
  const handleAddComment = async (data: CommentFormData) => {
    const result = await createComment(postId, data);

    if (result.success && result.comment) {
      // 댓글 목록에 새 댓글 추가
      setComments((prev) => [...prev, result.comment!]);
      // 댓글 수 업데이트
      if (post) {
        setPost({ ...post, comment_count: post.comment_count + 1 });
      }
    } else {
      throw new Error(result.message || 'Failed to add comment');
    }
  };

  /** 게시글 신고 */
  const handleReportPost = () => {
    setReportTarget({ type: 'post', id: postId });
    setReportModalOpen(true);
  };

  /** 댓글 신고 */
  const handleReportComment = (commentId: string) => {
    setReportTarget({ type: 'comment', id: commentId });
    setReportModalOpen(true);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <Link href={`/${locale}/community`} className={styles.backBtn}>
            <ArrowLeft size={20} />
            <span>{t('back_to_list')}</span>
          </Link>
        </header>
        <div className={styles.loadingWrapper}>
          <RefreshCw size={32} className={styles.spinning} />
          <p>{t('loading')}</p>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error || !post) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <Link href={`/${locale}/community`} className={styles.backBtn}>
            <ArrowLeft size={20} />
            <span>{t('back_to_list')}</span>
          </Link>
        </header>
        <div className={styles.errorWrapper}>
          <AlertCircle size={48} />
          <p>{error || t('error.post_not_found')}</p>
          <div className={styles.errorActions}>
            <button type="button" onClick={fetchPost} className={styles.retryBtn}>
              {t('retry')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/community`)}
              className={styles.backToListBtn}
            >
              {t('back_to_list')}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href={`/${locale}/community`} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>{t('back_to_list')}</span>
        </Link>
      </header>

      {/* 게시글 상세 */}
      <PostDetail post={post} onReport={handleReportPost} />

      {/* 댓글 섹션 */}
      <CommentSection
        comments={comments}
        postId={postId}
        onAddComment={handleAddComment}
        onReportComment={handleReportComment}
      />

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </main>
  );
}
