'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import classNames from 'classnames';
import type { PostFormData } from '@/types/community';
import styles from './PostForm.module.scss';

/**
 * PostForm Props
 */
interface PostFormProps {
  /** 현재 locale */
  locale: string;
  /** 폼 제출 핸들러 (옵션, API 연동 전 Mock) */
  onSubmit?: (data: PostFormData) => Promise<void>;
}

/**
 * 글쓰기 폼 컴포넌트
 * react-hook-form + Zod 유효성 검증
 */
export default function PostForm({ locale, onSubmit }: PostFormProps) {
  const t = useTranslations('Community');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zod 스키마 (번역 메시지 사용)
  const schema = z.object({
    nickname: z
      .string()
      .min(1, t('validation.nickname_required'))
      .max(20, t('validation.nickname_max')),
    title: z.string().min(1, t('validation.title_required')).max(100, t('validation.title_max')),
    content: z.string().min(1, t('validation.content_required')),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nickname: '',
      title: '',
      content: '',
    },
  });

  const nicknameValue = watch('nickname');
  const titleValue = watch('title');
  const contentValue = watch('content');

  /** 폼 제출 */
  const handleFormSubmit = async (data: PostFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Mock: API 연동 전 임시 처리
        console.log('Post submitted:', data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      router.push(`/${locale}/community`);
    } catch (_err) {
      setError('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  /** 취소 */
  const handleCancel = () => {
    router.back();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
      {/* 닉네임 */}
      <div
        className={classNames(styles.inputGroup, {
          [styles.hasValue]: !!nicknameValue,
          [styles.hasError]: !!errors.nickname,
        })}
      >
        <input
          {...register('nickname')}
          type="text"
          className={styles.input}
          maxLength={20}
          placeholder=" "
        />
        <label className={styles.floatingLabel}>{t('form.nickname')}</label>
        <span className={styles.charCount}>{nicknameValue.length}/20</span>
        {errors.nickname && <span className={styles.errorMsg}>{errors.nickname.message}</span>}
      </div>

      {/* 제목 */}
      <div
        className={classNames(styles.inputGroup, {
          [styles.hasValue]: !!titleValue,
          [styles.hasError]: !!errors.title,
        })}
      >
        <input
          {...register('title')}
          type="text"
          className={styles.input}
          maxLength={100}
          placeholder=" "
        />
        <label className={styles.floatingLabel}>{t('form.title')}</label>
        <span className={styles.charCount}>{titleValue.length}/100</span>
        {errors.title && <span className={styles.errorMsg}>{errors.title.message}</span>}
      </div>

      {/* 내용 */}
      <div
        className={classNames(styles.textareaGroup, {
          [styles.hasValue]: !!contentValue,
          [styles.hasError]: !!errors.content,
        })}
      >
        <textarea
          {...register('content')}
          className={styles.textarea}
          placeholder={t('form.content_placeholder')}
          rows={10}
        />
        {errors.content && <span className={styles.errorMsg}>{errors.content.message}</span>}
      </div>

      {/* 에러 메시지 */}
      {error && <div className={styles.globalError}>{error}</div>}

      {/* 버튼 영역 */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {t('form.cancel')}
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? t('form.submitting') : t('form.submit')}
        </button>
      </div>
    </form>
  );
}
