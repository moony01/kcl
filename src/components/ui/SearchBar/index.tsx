/**
 * SearchBar
 *
 * 아티스트/소속사 통합 검색 컴포넌트
 * 상단 고정(Sticky)되며 자동완성 기능을 제공합니다.
 *
 * 기능:
 * - 아티스트 이름으로 검색 → 소속사로 매핑
 * - 소속사 이름으로 직접 검색
 * - 자동완성 드롭다운
 * - 키보드 네비게이션 (위/아래 화살표, Enter)
 *
 * @updated T1.10 - useLeagueData 훅 연동 (API 기반 검색)
 */

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLeagueData } from '@/hooks/useLeagueData';
import styles from './SearchBar.module.scss';

interface SearchResult {
  type: 'company' | 'artist';
  companyId: string;
  companyName: string;
  artistName?: string;
  gradient: string;
}

interface SearchBarProps {
  /** 검색 결과 선택 시 콜백 */
  onSelect: (companyId: string, artistName?: string) => void;
  /** 플레이스홀더 텍스트 (선택) */
  placeholder?: string;
}

export default function SearchBar({ onSelect, placeholder }: SearchBarProps) {
  const t = useTranslations('Home');
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 🔥 API에서 로드된 소속사 데이터 사용
  const { allCompanies, isLoading } = useLeagueData({
    refreshInterval: 0, // 검색용은 자동 새로고침 불필요
    revalidateOnFocus: false,
  });

  // 검색 결과 생성 (아티스트 + 소속사 통합)
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() || allCompanies.length === 0) return [];

    const lowerQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    allCompanies.forEach((company) => {
      // 소속사 이름 매칭
      const companyNameMatch =
        company.nameEn.toLowerCase().includes(lowerQuery) || company.nameKo.includes(lowerQuery);

      // gradient 스타일 생성
      const gradient = company.gradientColor.startsWith('linear-gradient')
        ? company.gradientColor
        : `linear-gradient(135deg, ${company.gradientColor} 0%, #1A1A1A 100%)`;

      if (companyNameMatch) {
        results.push({
          type: 'company',
          companyId: company.companyId,
          companyName: company.nameEn,
          gradient,
        });
      }

      // 아티스트 이름 매칭
      company.artists.en.forEach((artist, idx) => {
        const koArtist = company.artists.ko[idx];
        if (artist.toLowerCase().includes(lowerQuery) || koArtist?.includes(lowerQuery)) {
          // 중복 방지: 이미 같은 회사가 있으면 추가 안함
          const exists = results.find(
            (r) => r.companyId === company.companyId && r.artistName === artist,
          );
          if (!exists) {
            results.push({
              type: 'artist',
              companyId: company.companyId,
              companyName: company.nameEn,
              artistName: artist,
              gradient,
            });
          }
        }
      });
    });

    // 최대 8개까지만 표시
    return results.slice(0, 8);
  }, [query, allCompanies]);

  // 하이라이트 인덱스 리셋
  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchResults]);

  // 결과 선택 핸들러
  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect(result.companyId, result.artistName);
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
          handleSelect(searchResults[highlightIndex]);
        } else if (searchResults.length > 0) {
          handleSelect(searchResults[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  // 검색창 클리어
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  // 포커스 아웃 시 드롭다운 닫기 (딜레이)
  const handleBlur = () => {
    // 클릭 이벤트 처리를 위해 약간의 딜레이
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={styles.searchWrapper}>
      <div className={styles.inputContainer}>
        {isLoading ? (
          <Loader2 className={`${styles.searchIcon} ${styles.spinning}`} size={18} />
        ) : (
          <Search className={styles.searchIcon} size={18} />
        )}
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={placeholder || t('search_placeholder')}
          value={query}
          onChange={handleChange}
          onFocus={() => query && setIsOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          disabled={isLoading}
        />
        {query && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 자동완성 드롭다운 */}
      <AnimatePresence>
        {isOpen && searchResults.length > 0 && (
          <motion.ul
            ref={listRef}
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {searchResults.map((result, idx) => (
              <li
                key={`${result.companyId}-${result.artistName || 'company'}`}
                className={`${styles.resultItem} ${
                  idx === highlightIndex ? styles.highlighted : ''
                }`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setHighlightIndex(idx)}
              >
                <div className={styles.resultAvatar} style={{ background: result.gradient }}>
                  {result.companyName.charAt(0)}
                </div>
                <div className={styles.resultInfo}>
                  {result.type === 'artist' ? (
                    <>
                      <span className={styles.artistName}>{result.artistName}</span>
                      <span className={styles.companyLabel}>@ {result.companyName}</span>
                    </>
                  ) : (
                    <span className={styles.companyName}>{result.companyName}</span>
                  )}
                </div>
                <span className={styles.resultType}>
                  {result.type === 'artist' ? 'Artist' : 'Company'}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
