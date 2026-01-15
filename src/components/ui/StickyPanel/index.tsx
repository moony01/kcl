/**
 * StickyPanel
 *
 * 데스크톱용 고정 우측 패널 컴포넌트
 * 스크롤과 무관하게 화면 우측에 고정됩니다.
 *
 * 기능:
 * - 스크롤 무관 고정 위치
 * - 반응형 (모바일에서는 숨김)
 * - 부드러운 진입 애니메이션
 * - 글래스모피즘 스타일
 */

'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './StickyPanel.module.scss';

interface StickyPanelProps {
  children: ReactNode;
  /** 패널 표시 여부 */
  isVisible?: boolean;
  /** 패널 타이틀 (선택) */
  title?: string;
  /** 닫기 버튼 클릭 핸들러 (선택) */
  onClose?: () => void;
}

export default function StickyPanel({
  children,
  isVisible = true,
  title,
  onClose,
}: StickyPanelProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          className={styles.stickyPanel}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
          }}
        >
          {/* 헤더 (타이틀이 있을 때만) */}
          {title && (
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>{title}</h3>
              {onClose && (
                <button className={styles.closeButton} onClick={onClose} aria-label="Close panel">
                  &times;
                </button>
              )}
            </div>
          )}

          {/* 콘텐츠 영역 */}
          <div className={styles.panelContent}>{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
