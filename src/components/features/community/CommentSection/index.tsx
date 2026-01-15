'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Trash2, Flag } from 'lucide-react';
import type { Comment, CommentFormData } from '@/types/community';
import CommentForm from '../CommentForm';
import styles from './CommentSection.module.scss';

/**
 * CommentSection Props
 */
interface CommentSectionProps {
  /** 댓글 목록 */
  comments: Comment[];
  /** 게시글 ID */
  postId: string;
  /** 댓글 추가 핸들러 */
  onAddComment?: (data: CommentFormData) => Promise<void>;
  /** 댓글 삭제 핸들러 */
  onDeleteComment?: (commentId: string) => Promise<void>;
  /** 댓글 신고 핸들러 */
  onReportComment?: (commentId: string) => void;
}

/**
 * 댓글 영역 컴포넌트
 * 댓글 목록 + 댓글 작성 폼
 */
export default function CommentSection({
  comments,
  postId,
  onAddComment,
  onDeleteComment,
  onReportComment,
}: CommentSectionProps) {
  const t = useTranslations('Community');
  const [localComments, setLocalComments] = useState<Comment[]>(comments);

  /** 날짜 포맷 */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffTime / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('ko', { month: 'short', day: 'numeric' });
  };

  /** 댓글 추가 */
  const handleAddComment = async (data: CommentFormData) => {
    if (onAddComment) {
      await onAddComment(data);
    } else {
      // Mock: API 연동 전 로컬 상태 업데이트
      const newComment: Comment = {
        id: Date.now().toString(),
        post_id: postId,
        nickname: data.nickname,
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setLocalComments((prev) => [newComment, ...prev]);
    }
  };

  /** 댓글 삭제 */
  const handleDelete = async (commentId: string) => {
    if (!window.confirm(t('comment.delete_confirm'))) return;

    if (onDeleteComment) {
      await onDeleteComment(commentId);
    } else {
      // Mock
      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <h3 className={styles.title}>
        <MessageSquare size={20} />
        {t('comment.title')} ({localComments.length})
      </h3>

      {/* 댓글 작성 폼 */}
      <CommentForm onSubmit={handleAddComment} />

      {/* 댓글 목록 */}
      <div className={styles.list}>
        {localComments.length === 0 ? (
          <p className={styles.empty}>{t('comment.no_comments')}</p>
        ) : (
          localComments.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.nickname}>{comment.nickname}</span>
                <span className={styles.time}>{formatDate(comment.created_at)}</span>
              </div>
              <p className={styles.content}>{comment.content}</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => onReportComment?.(comment.id)}
                  aria-label="Report comment"
                >
                  <Flag size={14} />
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => handleDelete(comment.id)}
                  aria-label="Delete comment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
