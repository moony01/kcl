/**
 * CompactSelect
 *
 * 재사용 가능한 인라인 셀렉트 컴포넌트 (검색 기능 포함)
 * StickyPanel(overflow-y: auto)과 BottomSheet 모두에서 안정적으로 작동합니다.
 *
 * 특징:
 * - 인라인 확장 방식 (absolute 드롭다운 대신 → overflow 잘림 문제 없음)
 * - 옵션 목록 내 검색 입력 필드 (타이핑으로 필터링)
 * - Framer Motion 열림/닫힘 애니메이션
 * - Click-outside 닫기
 * - ARIA listbox/combobox 패턴
 * - 터치 타겟 min-height 44px
 * - 다크/라이트 모드 대응
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import classNames from 'classnames';
import styles from './CompactSelect.module.scss';

/** 셀렉트 옵션 타입 */
interface SelectOption {
  value: string;
  label: string;
}

interface CompactSelectProps {
  /** 현재 선택된 값 (null이면 미선택 상태) */
  value: string | null;
  /** 값 변경 콜백 */
  onChange: (value: string | null) => void;
  /** 옵션 목록 */
  options: SelectOption[];
  /** 셀렉트 상단 레이블 텍스트 (선택) */
  label?: string;
  /** 미선택 시 표시할 플레이스홀더 */
  placeholder?: string;
  /** "전체" 옵션 표시 여부 */
  showAllOption?: boolean;
  /** "전체" 옵션 레이블 텍스트 */
  allOptionLabel?: string;
  /** 선택 해제(X) 버튼 표시 여부 */
  clearable?: boolean;
  /** 검색 기능 활성화 여부 (기본: true, 옵션이 5개 이상일 때 자동 표시) */
  searchable?: boolean;
  /** 검색 입력 플레이스홀더 */
  searchPlaceholder?: string;
}

export default function CompactSelect({
  value,
  onChange,
  options,
  label,
  placeholder = 'Select...',
  showAllOption = false,
  allOptionLabel = 'All',
  clearable = false,
  searchable,
  searchPlaceholder = 'Search...',
}: CompactSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [canScrollDown, setCanScrollDown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionListRef = useRef<HTMLDivElement>(null);

  // 검색 기능 표시 여부: 명시적으로 지정되지 않으면 옵션 5개 이상일 때 자동 활성화
  const showSearch = searchable ?? options.length >= 5;

  /** 현재 선택된 옵션의 레이블 찾기 */
  const selectedLabel =
    value === null && showAllOption
      ? allOptionLabel
      : options.find((o) => o.value === value)?.label;

  /** 검색어로 필터링된 옵션 목록 */
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchQuery]);

  /** 외부 클릭 시 셀렉트 닫기 */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /** 패널 열릴 때 검색 입력에 포커스 + 스크롤 상태 감지 */
  useEffect(() => {
    if (isOpen) {
      // 애니메이션 완료 후 포커스 및 스크롤 체크
      const timer = setTimeout(() => {
        if (showSearch) searchInputRef.current?.focus();
        // 스크롤 가능 여부 체크
        const el = optionListRef.current;
        if (el) {
          setCanScrollDown(el.scrollHeight > el.clientHeight);
        }
      }, 220);
      return () => clearTimeout(timer);
    } else {
      const timer = window.setTimeout(() => setCanScrollDown(false), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showSearch, filteredOptions.length]);

  /** 옵션 선택 핸들러 */
  const handleSelect = useCallback(
    (val: string | null) => {
      onChange(val);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onChange],
  );

  /** 선택 해제(X) 버튼 핸들러 */
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange],
  );

  return (
    <div className={styles.compactSelect} ref={containerRef}>
      {/* 레이블 */}
      {label && <p className={styles.label}>{label}</p>}

      {/* 트리거 버튼 */}
      <button
        type="button"
        className={classNames(styles.trigger, {
          [styles.open]: isOpen,
          [styles.hasValue]: selectedLabel && !isOpen,
        })}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className={classNames(styles.triggerText, {
            [styles.placeholder]: !selectedLabel,
            [styles.selected]: !!selectedLabel,
          })}
        >
          {selectedLabel || placeholder}
        </span>
        <span className={styles.triggerIcons}>
          {/* 선택 해제 버튼 (clearable이고, 값이 있을 때만 표시) */}
          {clearable && value !== null && (
            <span className={styles.clearButton} onClick={handleClear} role="button" tabIndex={-1}>
              <X size={14} />
            </span>
          )}
          <motion.span
            className={styles.chevron}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.span>
        </span>
      </button>

      {/* 옵션 목록 (인라인 확장) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.optionPanel}
            role="listbox"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            {/* 검색 입력 필드 */}
            {showSearch && (
              <div className={styles.searchBox}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className={styles.searchClear}
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* 옵션 목록 (최대 7개 높이 제한 + 스크롤) */}
            <div
              className={styles.optionList}
              ref={optionListRef}
              onScroll={(e) => {
                const el = e.currentTarget;
                // 하단에 도달하면 페이드 숨김
                setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
              }}
            >
              {/* "전체" 옵션 (검색 중이 아닐 때만 표시) */}
              {showAllOption && !searchQuery && (
                <button
                  type="button"
                  className={classNames(styles.option, { [styles.optionSelected]: value === null })}
                  onClick={() => handleSelect(null)}
                  role="option"
                  aria-selected={value === null}
                >
                  <span>{allOptionLabel}</span>
                  {value === null && <Check size={14} className={styles.checkIcon} />}
                </button>
              )}

              {/* 필터링된 옵션 */}
              {filteredOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  className={classNames(styles.option, {
                    [styles.optionSelected]: value === opt.value,
                  })}
                  onClick={() => handleSelect(opt.value)}
                  role="option"
                  aria-selected={value === opt.value}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check size={14} className={styles.checkIcon} />}
                </button>
              ))}

              {/* 검색 결과 없음 */}
              {filteredOptions.length === 0 && searchQuery && (
                <div className={styles.noResults}>
                  <span>No results</span>
                </div>
              )}
            </div>

            {/* 하단 스크롤 인디케이터 (더 많은 항목이 아래에 있음을 표시) */}
            {canScrollDown && <div className={styles.scrollHint} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
