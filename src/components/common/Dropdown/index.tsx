'use client';

import { useRef, useEffect } from 'react';
import styles from './Dropdown.module.scss';
import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  // Mock auth state passing
  isLoggedIn: boolean;
}

export default function MoreDropdown({ isOpen, onClose, isLoggedIn }: DropdownProps) {
  const t = useTranslations('Nav');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.popoverContent}
      ref={dropdownRef}
      style={{ position: 'absolute', bottom: '60px', left: '12px', zIndex: 1100 }}
    >
      <div className={styles.menuItem}>
        <Settings className={styles.itemIcon} />
        <span>{t('settings')}</span>
      </div>

      {/* 모드 전환 버튼은 사이드바 상단으로 이동됨 */}

      <div className={styles.divider}></div>

      {/* Dynamic Auth Item */}
      {isLoggedIn ? (
        <div className={styles.menuItem}>
          <span>{t('switch_account')}</span>
        </div>
      ) : null}

      <div className={styles.menuItem}>
        <span style={{ color: isLoggedIn ? '#ED4956' : '#0095f6', fontWeight: 600 }}>
          {isLoggedIn ? t('logout') : t('login')}
        </span>
      </div>
    </div>
  );
}
