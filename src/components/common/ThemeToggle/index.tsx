'use client';

/**
 * ThemeToggle 컴포넌트
 *
 * 다크/라이트 모드 전환 토글 버튼
 * Sun/Moon 아이콘으로 현재 테마 상태를 시각적으로 표시합니다.
 *
 * @description
 * - next-themes 라이브러리와 연동
 * - 접근성(A11y) 지원: ARIA 레이블, 키보드 네비게이션
 * - 부드러운 아이콘 전환 애니메이션
 */

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useSyncExternalStore, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import styles from './ThemeToggle.module.scss';

interface ThemeToggleProps {
  /** 컴팩트 모드 (아이콘만 표시) */
  compact?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 클라이언트 마운트 상태를 확인하는 훅
 * useSyncExternalStore를 사용하여 하이드레이션 불일치 방지
 */
function useIsMounted() {
  const subscribe = useCallback(() => () => {}, []);
  const getSnapshot = () => true;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const t = useTranslations('Nav');
  const { setTheme, resolvedTheme } = useTheme();

  // 하이드레이션 불일치 방지를 위한 마운트 상태 확인
  const mounted = useIsMounted();

  // 마운트 전에는 빈 버튼 표시 (하이드레이션 오류 방지)
  if (!mounted) {
    return (
      <button
        className={classNames(styles.toggleButton, className)}
        aria-label={t('mode_switch')}
        disabled
      >
        <div className={styles.iconWrapper}>
          <div className={styles.placeholder} />
        </div>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      className={classNames(styles.toggleButton, className, {
        [styles.compact]: compact,
      })}
      onClick={toggleTheme}
      aria-label={isDark ? t('mode_switch') + ' (Light)' : t('mode_switch') + ' (Dark)'}
      title={t('mode_switch')}
      type="button"
    >
      <div className={styles.iconWrapper}>
        {/* 아이콘 애니메이션 래퍼 */}
        <span className={classNames(styles.icon, { [styles.visible]: isDark })}>
          <Moon className={styles.moonIcon} />
        </span>
        <span className={classNames(styles.icon, { [styles.visible]: !isDark })}>
          <Sun className={styles.sunIcon} />
        </span>
      </div>
      {!compact && <span className={styles.label}>{t('mode_switch')}</span>}
    </button>
  );
}
