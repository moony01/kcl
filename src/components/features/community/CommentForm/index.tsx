'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, User } from 'lucide-react';
import type { CommentFormData } from '@/types/community';
import styles from './CommentForm.module.scss';

/**
 * CommentForm Props
 */
interface CommentFormProps {
  /** 댓글 등록 핸들러 */
  onSubmit?: (data: CommentFormData) => Promise<void>;
  /** 로그인 사용자 닉네임 (있으면 닉네임 입력 필드 숨김, 자동 주입) */
  authenticatedNickname?: string;
}

/**
 * 댓글 작성 폼 컴포넌트
 * - 로그인 사용자: 닉네임 자동 적용, 입력 필드 숨김
 * - 비로그인 사용자: 기존 닉네임 수동 입력 플로우 유지
 */
export default function CommentForm({ onSubmit, authenticatedNickname }: CommentFormProps) {
  const t = useTranslations('Community');
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 실제 사용할 닉네임 (로그인 시 프로필 닉네임, 비로그인 시 수동 입력값) */
  const effectiveNickname = authenticatedNickname || nickname.trim();

  /** 폼 제출 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveNickname || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ nickname: effectiveNickname, content: content.trim() });
      } else {
        // Mock
        console.log('Comment submitted:', { nickname: effectiveNickname, content });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setContent(''); // 내용만 초기화, 닉네임은 유지
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = effectiveNickname.length > 0 && content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {authenticatedNickname ? (
        /* 로그인 사용자: 닉네임 읽기 전용 표시 */
        <div className={styles.authenticatedRow}>
          <User size={16} />
          <span className={styles.authenticatedNickname}>{authenticatedNickname}</span>
        </div>
      ) : (
        /* 비로그인 사용자: 닉네임 입력 */
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.nicknameInput}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('form.nickname')}
            maxLength={20}
          />
          <span className={styles.nicknameCount}>{nickname.length}/20</span>
        </div>
      )}

      {/* 내용 입력 */}
      <div className={styles.textareaRow}>
        <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('comment.placeholder')}
          maxLength={200}
          rows={3}
        />
        <button type="submit" className={styles.submitBtn} disabled={!isValid || isSubmitting}>
          <Send size={18} />
        </button>
      </div>
      <div className={styles.charCount}>{content.length}/200</div>
    </form>
  );
}
