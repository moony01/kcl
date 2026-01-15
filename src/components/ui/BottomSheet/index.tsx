/**
 * BottomSheet
 *
 * 모바일 슬라이드업 패널 컴포넌트
 * 하단에서 위로 올라오는 시트 UI를 제공합니다.
 *
 * 기능:
 * - 드래그로 닫기 (아래로 스와이프)
 * - 오버레이 클릭으로 닫기
 * - 스프링 애니메이션
 * - 스크롤 잠금
 */

'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import styles from './BottomSheet.module.scss';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 시트 높이 비율 (0.3 ~ 0.9, 기본값: 0.7) */
  heightRatio?: number;
  /** 드래그로 닫기 활성화 여부 */
  enableDrag?: boolean;
}

/** 드래그 닫기 임계값 (픽셀) */
const DRAG_CLOSE_THRESHOLD = 100;

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  heightRatio = 0.7,
  enableDrag = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // 스크롤 잠금 처리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC 키 핸들러
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 드래그 종료 핸들러
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // 아래로 충분히 드래그하면 닫기
    if (info.offset.y > DRAG_CLOSE_THRESHOLD || info.velocity.y > 500) {
      onClose();
    }
  };

  // 시트 높이 계산
  const sheetHeight = `${Math.min(Math.max(heightRatio, 0.3), 0.9) * 100}vh`;

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={styles.bottomSheetWrapper}>
          {/* 오버레이 */}
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* 시트 본체 */}
          <motion.div
            ref={sheetRef}
            className={styles.sheet}
            style={{ maxHeight: sheetHeight }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            drag={enableDrag ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* 드래그 핸들 */}
            {enableDrag && (
              <div className={styles.dragHandle} onPointerDown={(e) => dragControls.start(e)}>
                <div className={styles.handleBar} />
              </div>
            )}

            {/* 콘텐츠 영역 */}
            <div className={styles.content}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
