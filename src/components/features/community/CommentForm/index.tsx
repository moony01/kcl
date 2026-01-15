'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import type { CommentFormData } from '@/types/community';
import styles from './CommentForm.module.scss';

/**
 * CommentForm Props
 */
interface CommentFormProps {
  /** 댓글 등록 핸들러 */
  onSubmit?: (data: CommentFormData) => Promise<void>;
}

/**
 * 댓글 작성 폼 컴포넌트
 */
export default function CommentForm({ onSubmit }: CommentFormProps) {
  const t = useTranslations('Community');
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 폼 제출 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({ nickname: nickname.trim(), content: content.trim() });
      } else {
        // Mock
        console.log('Comment submitted:', { nickname, content });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setContent(''); // 내용만 초기화, 닉네임은 유지
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = nickname.trim().length > 0 && content.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.nicknameInput}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('form.nickname')}
          maxLength={20}
        />
      </div>
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
