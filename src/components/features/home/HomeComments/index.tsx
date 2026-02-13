'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, Trash2, Send, Loader2, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getHomeComments,
  createHomeComment,
  deleteHomeComment,
  getHomeCommentCount,
  toggleHomeCommentLike,
  getHomeCommentLikedIds,
  type HomeComment,
} from '@/lib/api/home-comments';
import { getFingerprint } from '@/lib/utils/fingerprint';
import styles from './HomeComments.module.scss';

/** 스팸 방지: 최소 작성 간격 (ms) */
const MIN_SUBMIT_INTERVAL = 5000;

/** 페이지당 댓글 수 (11개부터 2페이지 표시) */
const PAGE_SIZE = 10;

/**
 * 메인 페이지 댓글 컴포넌트
 * 댓글 목록 + 작성 폼 + 삭제 기능
 * 뉴스 댓글(NewsComments)과 동일 패턴, slug 없는 글로벌 댓글
 */
export default function HomeComments() {
  const t = useTranslations('HomeComments');

  const [comments, setComments] = useState<HomeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 댓글 작성 폼
  const [authorName, setAuthorName] = useState('');
  const [password, setPassword] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');

  // 좋아요 상태
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likingId, setLikingId] = useState<string | null>(null);

  // 삭제 모달
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  /** 총 페이지 수 계산 */
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /** 특정 페이지의 댓글 목록 조회 */
  const fetchPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const offset = (page - 1) * PAGE_SIZE;
      const [data, count] = await Promise.all([
        getHomeComments(PAGE_SIZE, offset),
        getHomeCommentCount(),
      ]);
      setComments(data);
      setTotalCount(count);
      setCurrentPage(page);
    } catch {
      // 조회 실패 무시
    } finally {
      setLoading(false);
    }
  }, []);

  /** 페이지 이동 핸들러 */
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchPage(page);
  }, [totalPages, currentPage, fetchPage]);

  /** 사용자 좋아요 목록 조회 */
  const fetchLikedIds = useCallback(async () => {
    const fp = getFingerprint();
    if (!fp) return;
    try {
      const ids = await getHomeCommentLikedIds(fp);
      setLikedIds(new Set(ids));
    } catch {
      // 조회 실패 무시
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
    fetchLikedIds();
  }, [fetchPage, fetchLikedIds]);

  /** 댓글 작성 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // 입력값 검증
    if (!authorName.trim()) {
      setFormError(t('error_name_required'));
      return;
    }
    if (!password.trim()) {
      setFormError(t('error_password_required'));
      return;
    }
    if (password.trim().length < 4) {
      setFormError(t('error_password_min'));
      return;
    }
    if (!content.trim()) {
      setFormError(t('error_content_required'));
      return;
    }
    if (content.trim().length < 2) {
      setFormError(t('error_content_min'));
      return;
    }

    // 스팸 방지: 최소 간격 체크
    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
      setFormError(t('error_too_fast'));
      return;
    }

    try {
      setSubmitting(true);
      const newComment = await createHomeComment({
        author_name: authorName.trim(),
        password: password.trim(),
        content: content.trim(),
      });

      if (newComment) {
        // 새 댓글 작성 후 1페이지로 새로고침 (최신순이므로 맨 앞에 표시)
        await fetchPage(1);
        // 모든 입력 필드 초기화
        setAuthorName('');
        setPassword('');
        setContent('');
        setLastSubmitTime(now);
      } else {
        setFormError(t('error_submit_failed'));
      }
    } catch {
      setFormError(t('error_submit_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  /** 좋아요 토글 (Optimistic Update) */
  const handleLike = async (commentId: string) => {
    if (likingId) return; // 이미 처리 중이면 무시

    const fp = getFingerprint();
    if (!fp) return;

    const wasLiked = likedIds.has(commentId);

    // Optimistic: 즉시 UI 반영
    setLikingId(commentId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes_count: c.likes_count + (wasLiked ? -1 : 1) }
          : c,
      ),
    );

    try {
      const result = await toggleHomeCommentLike(commentId, fp);
      if (result) {
        // 서버 응답으로 정확한 값 동기화
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likes_count: result.likes_count }
              : c,
          ),
        );
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (result.liked) {
            next.add(commentId);
          } else {
            next.delete(commentId);
          }
          return next;
        });
      }
    } catch {
      // 실패 시 롤백
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) {
          next.add(commentId);
        } else {
          next.delete(commentId);
        }
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: c.likes_count + (wasLiked ? 1 : -1) }
            : c,
        ),
      );
    } finally {
      setLikingId(null);
    }
  };

  /** 삭제 모달 열기 */
  const openDeleteModal = (commentId: string) => {
    setDeleteTarget(commentId);
    setDeletePassword('');
    setDeleteError('');
  };

  /** 삭제 실행 */
  const handleDelete = async () => {
    if (!deleteTarget || !deletePassword.trim()) return;

    try {
      setDeleting(true);
      setDeleteError('');
      const success = await deleteHomeComment({
        id: deleteTarget,
        password: deletePassword.trim(),
      });

      if (success) {
        setDeleteTarget(null);
        // 삭제 후 현재 페이지 새로고침 (페이지가 비면 이전 페이지로)
        const newTotal = totalCount - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / PAGE_SIZE));
        await fetchPage(Math.min(currentPage, maxPage));
      } else {
        setDeleteError(t('error_wrong_password'));
      }
    } catch {
      setDeleteError(t('error_delete_failed'));
    } finally {
      setDeleting(false);
    }
  };

  /** 날짜 포맷팅 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA');
  };

  return (
    <div className={styles.commentsSection}>
      {/* 섹션 헤더 */}
      <div className={styles.sectionHeader}>
        <MessageCircle size={18} />
        <h3>{t('title')}</h3>
        <span className={styles.commentCount}>{totalCount}</span>
      </div>

      {/* 댓글 작성 폼 */}
      <form className={styles.commentForm} onSubmit={handleSubmit}>
        <div className={styles.formRow}>
          <input
            type="text"
            className={styles.inputField}
            placeholder={t('placeholder_name')}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={30}
          />
          <input
            type="password"
            className={styles.inputField}
            placeholder={t('placeholder_password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={20}
          />
        </div>
        <div className={styles.formRow}>
          <textarea
            className={styles.textareaField}
            placeholder={t('placeholder_content')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        {formError && <p className={styles.errorText}>{formError}</p>}
        <div className={styles.formActions}>
          <span className={styles.charCount}>{content.length}/500</span>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 size={16} className={styles.spinner} />
            ) : (
              <Send size={14} />
            )}
            <span>{t('submit')}</span>
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      {loading ? (
        <div className={styles.loadingState}>
          <p>{t('loading')}</p>
        </div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>
          <p>{t('no_comments')}</p>
        </div>
      ) : (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.authorName}>{comment.author_name}</span>
                <span className={styles.commentDate}>{formatDate(comment.created_at)}</span>
                <button
                  className={styles.deleteButton}
                  onClick={() => openDeleteModal(comment.id)}
                  title={t('delete')}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <p className={styles.commentContent}>{comment.content}</p>
              <div className={styles.commentFooter}>
                <button
                  className={`${styles.likeButton} ${likedIds.has(comment.id) ? styles.liked : ''}`}
                  onClick={() => handleLike(comment.id)}
                  disabled={likingId === comment.id}
                  title={likedIds.has(comment.id) ? t('liked') : t('like')}
                >
                  <Heart size={14} />
                  {comment.likes_count > 0 && (
                    <span className={styles.likeCount}>{comment.likes_count}</span>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* 페이지 네비게이션 */}
          {totalPages >= 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ''}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageButton}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h4>{t('delete_title')}</h4>
            <p>{t('delete_message')}</p>
            <input
              type="password"
              className={styles.inputField}
              placeholder={t('placeholder_password')}
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoFocus
            />
            {deleteError && <p className={styles.errorText}>{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setDeleteTarget(null)}
              >
                {t('cancel')}
              </button>
              <button
                className={styles.confirmDeleteButton}
                onClick={handleDelete}
                disabled={deleting || !deletePassword.trim()}
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
