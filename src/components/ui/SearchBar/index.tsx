/**
 * SearchBar
 *
 * 아티스트/소속사 통합 검색 컴포넌트
 * 상단 고정(Sticky)되며 자동완성 기능을 제공합니다.
 *
 * 기능:
 * - 인기 키워드 칩 (상위 5개 소속사, 화력순 정렬)
 * - 아티스트 이름으로 검색 -> 소속사로 매핑
 * - 소속사 이름으로 직접 검색
 * - 카테고리별 자동완성 드롭다운 (회사 / 아티스트 분리)
 * - 빈 결과 상태 메시지
 * - 키보드 네비게이션 (위/아래 화살표, Enter, Escape)
 *
 * @updated T1.68 - 인기 키워드 칩 + 카테고리 드롭다운 + 빈 상태 메시지
 * @updated T1.69 - 라이트 모드 스타일 개선
 * @updated T1.10 - useLeagueData 훅 연동 (API 기반 검색)
 */

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, Loader2, Flame, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useLeagueData } from '@/hooks/useLeagueData';
import styles from './SearchBar.module.scss';

/** 검색 결과 아이템 타입 */
interface SearchResult {
  type: 'company' | 'artist';
  companyId: string;
  companyName: string;
  artistName?: string;
  gradient: string;
  /** 전체 순위 (#1, #2...) */
  rank: number;
  /** 화력 (투표 수) */
  voteCount: number;
}

/** 인기 칩에 표시할 소속사 정보 */
interface PopularChip {
  companyId: string;
  name: string;
  gradient: string;
  voteCount: number;
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
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // API에서 로드된 소속사 데이터 사용 (SWR 캐시 공유)
  const { allCompanies, isLoading } = useLeagueData({
    refreshInterval: 0, // 검색용은 자동 새로고침 불필요
    revalidateOnFocus: false,
  });

  /**
   * 인기 키워드 칩 데이터
   * 화력(voteCount) 기준 내림차순 정렬, 상위 5개
   */
  const popularChips = useMemo((): PopularChip[] => {
    if (allCompanies.length === 0) return [];

    return [...allCompanies]
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 5)
      .map((company) => ({
        companyId: company.companyId,
        name: company.nameEn,
        gradient: company.gradientColor.startsWith('linear-gradient')
          ? company.gradientColor
          : `linear-gradient(135deg, ${company.gradientColor} 0%, #1A1A1A 100%)`,
        voteCount: company.voteCount,
      }));
  }, [allCompanies]);

  /**
   * 검색 결과 생성 (아티스트 + 소속사 통합)
   * 소속사 결과와 아티스트 결과를 분리하여 반환
   */
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
          rank: company.rank,
          voteCount: company.voteCount,
        });
      }

      // 아티스트 이름 매칭
      company.artists.en.forEach((artist, idx) => {
        const koArtist = company.artists.ko[idx];
        if (artist.toLowerCase().includes(lowerQuery) || koArtist?.includes(lowerQuery)) {
          // 중복 방지: 이미 같은 회사+아티스트 조합이 있으면 추가 안함
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
              rank: company.rank,
              voteCount: company.voteCount,
            });
          }
        }
      });
    });

    // 최대 8개까지만 표시
    return results.slice(0, 8);
  }, [query, allCompanies]);

  /** 카테고리별 분리된 결과 (회사 / 아티스트) */
  const companyResults = useMemo(
    () => searchResults.filter((r) => r.type === 'company'),
    [searchResults],
  );
  const artistResults = useMemo(
    () => searchResults.filter((r) => r.type === 'artist'),
    [searchResults],
  );

  /** 플랫 인덱스 배열: 키보드 네비게이션용 (섹션 헤더 제외) */
  const flatResults = useMemo(() => searchResults, [searchResults]);

  // 하이라이트 인덱스 리셋 (결과 변경 시)
  useEffect(() => {
    setHighlightIndex(-1);
  }, [searchResults]);

  /** 인기 칩 클릭 핸들러 */
  const handleChipClick = useCallback(
    (companyId: string) => {
      onSelect(companyId);
    },
    [onSelect],
  );

  /** 결과 선택 핸들러 */
  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelect(result.companyId, result.artistName);
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onSelect],
  );

  /** 키보드 네비게이션 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < flatResults.length) {
          handleSelect(flatResults[highlightIndex]);
        } else if (flatResults.length > 0) {
          handleSelect(flatResults[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  /** 입력값 변경 핸들러 */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  /** 검색창 클리어 */
  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  /** 포커스 인 핸들러 */
  const handleFocus = () => {
    setIsFocused(true);
    if (query) setIsOpen(true);
  };

  /** 포커스 아웃 시 드롭다운 닫기 (딜레이) */
  const handleBlur = () => {
    // 클릭 이벤트 처리를 위해 약간의 딜레이
    setTimeout(() => {
      setIsOpen(false);
      setIsFocused(false);
    }, 150);
  };

  /** 화력 숫자 포맷팅 (1234 -> 1.2K) */
  const formatVoteCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  /** 인기 칩 표시 조건: 데이터 로드 완료 + 쿼리 없음 */
  const showChips = popularChips.length > 0 && !query.trim();

  /** 드롭다운 표시 조건: 쿼리가 있고 포커스 상태 */
  const showDropdown = isOpen && query.trim().length > 0;

  /** 빈 결과 상태: 쿼리가 있지만 결과가 없음 */
  const showEmptyState = showDropdown && searchResults.length === 0 && !isLoading;

  /** 결과 표시: 쿼리가 있고 결과가 있음 */
  const showResults = showDropdown && searchResults.length > 0;

  /**
   * 하이라이트된 항목의 플랫 인덱스에서
   * 해당 결과가 현재 하이라이트 상태인지 체크
   */
  const isHighlighted = (result: SearchResult): boolean => {
    if (highlightIndex < 0) return false;
    return flatResults[highlightIndex] === result;
  };

  return (
    <div className={styles.searchWrapper}>
      {/* 검색 입력 영역 */}
      <div className={`${styles.inputContainer} ${isFocused ? styles.focused : ''}`}>
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
          onFocus={handleFocus}
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

      {/* 인기 키워드 칩 영역 */}
      <AnimatePresence>
        {showChips && (
          <motion.div
            className={styles.chipsContainer}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.chipsLabel}>
              <Flame size={13} className={styles.chipsLabelIcon} />
              <span>{t('search_popular')}</span>
            </div>
            <div className={styles.chipsList}>
              {popularChips.map((chip) => (
                <button
                  key={chip.companyId}
                  className={styles.chip}
                  onClick={() => handleChipClick(chip.companyId)}
                  type="button"
                >
                  <span
                    className={styles.chipAccent}
                    style={{ background: chip.gradient }}
                  />
                  <span className={styles.chipName}>{chip.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 자동완성 드롭다운 (카테고리 분리) */}
      <AnimatePresence>
        {(showResults || showEmptyState) && (
          <motion.div
            ref={listRef}
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            role="listbox"
          >
            {/* 빈 결과 상태 */}
            {showEmptyState && (
              <div className={styles.emptyState}>
                <Search size={20} className={styles.emptyIcon} />
                <span>{t('search_no_results')}</span>
              </div>
            )}

            {/* 회사 결과 섹션 */}
            {companyResults.length > 0 && (
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <Building2 size={14} />
                  <span>{t('search_companies')}</span>
                </div>
                {companyResults.map((result) => (
                  <div
                    key={`company-${result.companyId}`}
                    className={`${styles.resultItem} ${isHighlighted(result) ? styles.highlighted : ''}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setHighlightIndex(flatResults.indexOf(result))}
                    role="option"
                    aria-selected={isHighlighted(result)}
                  >
                    {/* 소속사 아바타 (gradient 배경 + 이니셜) */}
                    <div
                      className={styles.resultAvatar}
                      style={{ background: result.gradient }}
                    >
                      {result.companyName.charAt(0)}
                    </div>
                    {/* 소속사 정보 */}
                    <div className={styles.resultInfo}>
                      <span className={styles.companyName}>{result.companyName}</span>
                    </div>
                    {/* 순위 + 화력 메타 정보 */}
                    <div className={styles.resultMeta}>
                      <span className={styles.rankBadge}>#{result.rank}</span>
                      <span className={styles.voteMeta}>
                        <Flame size={11} className={styles.flameIcon} />
                        {formatVoteCount(result.voteCount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 회사/아티스트 섹션 구분선 */}
            {companyResults.length > 0 && artistResults.length > 0 && (
              <div className={styles.sectionDivider} />
            )}

            {/* 아티스트 결과 섹션 */}
            {artistResults.length > 0 && (
              <div className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <User size={14} />
                  <span>{t('search_artists')}</span>
                </div>
                {artistResults.map((result) => (
                  <div
                    key={`artist-${result.companyId}-${result.artistName}`}
                    className={`${styles.resultItem} ${isHighlighted(result) ? styles.highlighted : ''}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setHighlightIndex(flatResults.indexOf(result))}
                    role="option"
                    aria-selected={isHighlighted(result)}
                  >
                    {/* 아티스트 아바타 */}
                    <div
                      className={styles.resultAvatar}
                      style={{ background: result.gradient }}
                    >
                      {(result.artistName || '?').charAt(0)}
                    </div>
                    {/* 아티스트 이름 + 소속사 매핑 표시 */}
                    <div className={styles.resultInfo}>
                      <span className={styles.artistName}>{result.artistName}</span>
                      <span className={styles.companyLabel}>
                        <span className={styles.arrow}>&#8594;</span> {result.companyName}
                      </span>
                    </div>
                    {/* 순위 배지 */}
                    <div className={styles.resultMeta}>
                      <span className={styles.rankBadge}>#{result.rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
