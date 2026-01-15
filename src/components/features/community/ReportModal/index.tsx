'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import Modal from '@/components/common/Modal';
import type { ReportReason, ReportFormData } from '@/types/community';
import styles from './ReportModal.module.scss';

/**
 * ReportModal Props
 */
interface ReportModalProps {
  /** 모달 오픈 상태 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 신고 대상 타입 */
  targetType: 'post' | 'comment';
  /** 신고 대상 ID */
  targetId: string;
  /** 신고 제출 핸들러 */
  onSubmit?: (
    data: ReportFormData & { targetType: 'post' | 'comment'; targetId: string },
  ) => Promise<void>;
}

const REPORT_REASONS: ReportReason[] = ['spam', 'inappropriate', 'harassment', 'other'];

/**
 * 신고 모달 컴포넌트
 */
export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  onSubmit,
}: ReportModalProps) {
  const t = useTranslations('Community');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** 신고 제출 */
  const handleSubmit = async () => {
    if (!reason || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit({
          reason,
          detail: detail.trim() || undefined,
          targetType,
          targetId,
        });
      } else {
        // Mock
        console.log('Report submitted:', { targetType, targetId, reason, detail });
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      alert(t('report.success'));
      onClose();
      // Reset
      setReason('');
      setDetail('');
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('report.title')}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <AlertTriangle size={32} />
        </div>

        {/* 신고 사유 선택 */}
        <div className={styles.field}>
          <label className={styles.label}>{t('report.reason')}</label>
          <div className={styles.radioGroup}>
            {REPORT_REASONS.map((r) => (
              <label key={r} className={styles.radioLabel}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className={styles.radioInput}
                />
                <span className={styles.radioText}>{t(`report.reasons.${r}`)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 상세 내용 (선택) */}
        <div className={styles.field}>
          <label className={styles.label}>{t('report.detail')}</label>
          <textarea
            className={styles.textarea}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t('report.detail_placeholder')}
            maxLength={500}
            rows={3}
          />
        </div>

        {/* 버튼 */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('report.cancel')}
          </button>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
