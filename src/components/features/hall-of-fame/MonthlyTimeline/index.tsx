/**
 * MonthlyTimeline 컴포넌트
 *
 * 해당 연도의 월별 우승 기록을 단일 리스트로 표시합니다.
 */

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { MonthlyChampion } from '@/types/hall-of-fame';
import ChampionBadge from '../ChampionBadge';
import styles from './MonthlyTimeline.module.scss';

interface MonthlyTimelineProps {
  /** 연도 */
  year: number;
  /** 데이터 기준 현재 연도 */
  currentYear: number;
  /** 월간 챔피언 목록 */
  champions: MonthlyChampion[];
  /** 선택 가능한 아카이브 연도 */
  availableYears: number[];
  /** 연도 선택 */
  onYearChange: (year: number) => void;
}

// 월 정보 (1-12)
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function MonthlyTimeline({
  year,
  currentYear,
  champions,
  availableYears,
  onYearChange,
}: MonthlyTimelineProps) {
  const t = useTranslations('HallOfFame');
  const now = new Date();

  // 월별 챔피언 맵 생성
  const championMap = useMemo(() => {
    const map = new Map<number, MonthlyChampion>();
    champions.forEach((champion) => {
      map.set(champion.month, champion);
    });
    return map;
  }, [champions]);

  const getEmptyStatus = (month: number) => {
    if (year === currentYear && year === now.getFullYear()) {
      if (month === now.getMonth() + 1) {
        return { label: t('in_progress'), className: styles.inProgress };
      }
      if (month > now.getMonth() + 1) {
        return { label: t('upcoming'), className: styles.upcoming };
      }
    }

    if (year > now.getFullYear()) {
      return { label: t('upcoming'), className: styles.upcoming };
    }

    return { label: t('no_record'), className: styles.noRecord };
  };

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>{t('archive_year', { year })}</h2>

        <div className={styles.yearTabs} aria-label={t('year_archive')}>
          {availableYears.map((archiveYear) => (
            <button
              key={archiveYear}
              type="button"
              className={`${styles.yearTab} ${archiveYear === year ? styles.activeYear : ''}`}
              onClick={() => onYearChange(archiveYear)}
              aria-pressed={archiveYear === year}
            >
              {archiveYear}
            </button>
          ))}
        </div>
      </header>

      <ul className={styles.recordList} key={year}>
        {MONTHS.map((month) => {
          const champion = championMap.get(month);
          const emptyStatus = champion ? null : getEmptyStatus(month);
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
            <li key={month} className={styles.monthSlot}>
              {champion ? (
                <ChampionBadge champion={champion} />
              ) : (
                <div className={`${styles.emptySlot} ${emptyStatus?.className ?? ''}`}>
                  <span className={styles.emptyMonth}>{t(`months.${monthKey}`)}</span>
                  <span className={styles.emptyValue}>—</span>
                  <span className={styles.emptyStatus}>{emptyStatus?.label}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
