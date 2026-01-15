/**
 * MonthlyTimeline 컴포넌트
 *
 * 월별 챔피언 타임라인/그리드를 표시합니다.
 * 해당 연도의 각 월별 우승자를 배지 형태로 보여줍니다.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MonthlyChampion } from '@/types/hall-of-fame';
import ChampionBadge from '../ChampionBadge';
import styles from './MonthlyTimeline.module.scss';

interface MonthlyTimelineProps {
  /** 연도 */
  year: number;
  /** 월간 챔피언 목록 */
  champions: MonthlyChampion[];
  /** 이전 연도로 이동 */
  onPrevYear?: () => void;
  /** 다음 연도로 이동 */
  onNextYear?: () => void;
  /** 이전 연도 존재 여부 */
  hasPrevYear?: boolean;
  /** 다음 연도 존재 여부 */
  hasNextYear?: boolean;
}

// 월 정보 (1-12)
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function MonthlyTimeline({
  year,
  champions,
  onPrevYear,
  onNextYear,
  hasPrevYear = false,
  hasNextYear = false,
}: MonthlyTimelineProps) {
  const t = useTranslations('HallOfFame');

  // 월별 챔피언 맵 생성
  const championMap = useMemo(() => {
    const map = new Map<number, MonthlyChampion>();
    champions.forEach((champion) => {
      map.set(champion.month, champion);
    });
    return map;
  }, [champions]);

  return (
    <section className={styles.container}>
      {/* 섹션 헤더 */}
      <header className={styles.header}>
        <h3 className={styles.title}>
          {year} {t('monthly_champions')}
        </h3>

        {/* 연도 네비게이션 */}
        <div className={styles.yearNav}>
          <button
            className={styles.navButton}
            onClick={onPrevYear}
            disabled={!hasPrevYear}
            aria-label="Previous year"
          >
            <ChevronLeft size={20} />
          </button>
          <span className={styles.yearLabel}>{year}</span>
          <button
            className={styles.navButton}
            onClick={onNextYear}
            disabled={!hasNextYear}
            aria-label="Next year"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* 월별 그리드 */}
      <motion.div
        className={styles.grid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        key={year} // 연도 변경 시 애니메이션 재실행
      >
        {MONTHS.map((month) => {
          const champion = championMap.get(month);
          const monthKey = month.toString() as
            | '1'
            | '2'
            | '3'
            | '4'
            | '5'
            | '6'
            | '7'
            | '8'
            | '9'
            | '10'
            | '11'
            | '12';

          return (
            <div key={month} className={styles.monthSlot}>
              {champion ? (
                <ChampionBadge champion={champion} size="medium" />
              ) : (
                <div className={styles.emptySlot}>
                  <span className={styles.emptyMonth}>{t(`months.${monthKey}`)}</span>
                  <span className={styles.emptyLabel}>-</span>
                </div>
              )}
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
