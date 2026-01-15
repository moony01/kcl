/**
 * Hall of Fame 페이지
 *
 * 명예의 전당 메인 페이지입니다.
 * KCL 리그의 역사와 챔피언들을 표시합니다.
 *
 * 레이아웃:
 * - Grand Champion (직전 연도 대상 수상자)
 * - Current Race (현재 연도 경쟁 현황)
 * - Monthly Timeline (월별 챔피언)
 * - Archives (역대 대상 수상자)
 */

'use client';

export const runtime = 'edge';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useHallOfFame } from '@/hooks/useHallOfFame';

// Feature Components
import GrandChampionCard from '@/components/features/hall-of-fame/GrandChampionCard';
import CurrentRaceChart from '@/components/features/hall-of-fame/CurrentRaceChart';
import MonthlyTimeline from '@/components/features/hall-of-fame/MonthlyTimeline';
import ArchivesCarousel from '@/components/features/hall-of-fame/ArchivesCarousel';

import styles from './page.module.scss';

export default function HallOfFamePage() {
  const t = useTranslations('HallOfFame');
  const { data, isLoading, error, getMonthlyChampions, getYearlyRace } = useHallOfFame();

  // 현재 선택된 연도 (Monthly Timeline용)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // 연도 변경 핸들러
  const handlePrevYear = useCallback(() => {
    setSelectedYear((prev) => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setSelectedYear((prev) => prev + 1);
  }, []);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>{t('loading') || 'Loading...'}</p>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!data) {
    return (
      <div className={styles.emptyContainer}>
        <p>{t('no_champion_yet')}</p>
      </div>
    );
  }

  // 선택된 연도의 데이터 가져오기
  const monthlyChampions = getMonthlyChampions(selectedYear);
  const yearlyRace = getYearlyRace(data.currentYear);

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* Grand Champion 섹션 */}
      {data.latestGrandChampion && (
        <section className={styles.grandChampionSection}>
          <GrandChampionCard champion={data.latestGrandChampion} />
        </section>
      )}

      {/* Current Race + Monthly Timeline (2단 레이아웃) */}
      <div className={styles.twoColumnLayout}>
        {/* Current Race (현재 연도 경쟁 현황) */}
        <section className={styles.raceSection}>
          <CurrentRaceChart year={data.currentYear} data={yearlyRace} maxWins={12} />
        </section>

        {/* Monthly Timeline (월별 챔피언) */}
        <section className={styles.timelineSection}>
          <MonthlyTimeline
            year={selectedYear}
            champions={monthlyChampions}
            onPrevYear={handlePrevYear}
            onNextYear={handleNextYear}
            hasPrevYear={selectedYear > 2023}
            hasNextYear={selectedYear < data.currentYear}
          />
        </section>
      </div>

      {/* Archives (역대 대상 수상자) */}
      <section className={styles.archivesSection}>
        <ArchivesCarousel archives={data.archives} />
      </section>
    </main>
  );
}
