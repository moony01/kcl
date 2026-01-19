/**
 * HallOfFameClient (클라이언트 컴포넌트)
 *
 * 명예의 전당 페이지의 클라이언트 사이드 로직
 * SSG 정적 셸에서 렌더링되고, SWR로 클라이언트에서 데이터 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { useHallOfFame } from '@/hooks/useHallOfFame';

// Feature Components
import GrandChampionCard from '@/components/features/hall-of-fame/GrandChampionCard';
import CurrentRaceChart from '@/components/features/hall-of-fame/CurrentRaceChart';
import MonthlyTimeline from '@/components/features/hall-of-fame/MonthlyTimeline';
import ArchivesCarousel from '@/components/features/hall-of-fame/ArchivesCarousel';

import styles from './page.module.scss';

/**
 * 로딩 스켈레톤 컴포넌트
 * 실제 레이아웃과 유사한 형태로 shimmer 애니메이션 표시
 */
function LoadingSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      {/* 헤더 스켈레톤 */}
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>

      {/* Grand Champion 스켈레톤 */}
      <div className={styles.skeletonChampion}>
        <div className={styles.skeletonBadge} />
        <div className={styles.skeletonLogo} />
        <div className={styles.skeletonName} />
        <div className={styles.skeletonStats} />
      </div>

      {/* 2단 레이아웃 스켈레톤 */}
      <div className={styles.skeletonTwoColumn}>
        <div className={styles.skeletonRace}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.skeletonBar} />
          <div className={styles.skeletonBar} />
          <div className={styles.skeletonBar} />
        </div>
        <div className={styles.skeletonTimeline}>
          <div className={styles.skeletonSectionTitle} />
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.skeletonMonth} />
            ))}
          </div>
        </div>
      </div>

      {/* Archives 스켈레톤 */}
      <div className={styles.skeletonArchives}>
        <div className={styles.skeletonSectionTitle} />
        <div className={styles.skeletonCarousel}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 * 재시도 버튼과 에러 메시지 표시
 */
interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useTranslations('HallOfFame');
  const tCommon = useTranslations('Common');

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <AlertCircle className={styles.errorIcon} size={48} />
        <h2 className={styles.errorTitle}>{tCommon('error')}</h2>
        <p className={styles.errorMessage}>{message}</p>
        <button className={styles.retryButton} onClick={onRetry}>
          <RefreshCw size={18} />
          <span>재시도</span>
        </button>
      </div>
    </div>
  );
}

/**
 * 빈 상태 컴포넌트
 * 데이터가 없을 때 안내 메시지 표시
 */
function EmptyState() {
  const t = useTranslations('HallOfFame');

  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyContent}>
        <Trophy className={styles.emptyIcon} size={64} />
        <h2 className={styles.emptyTitle}>{t('no_champion_yet')}</h2>
        <p className={styles.emptyMessage}>첫 번째 챔피언이 탄생할 때까지 기다려주세요!</p>
      </div>
    </div>
  );
}

/**
 * 명예의 전당 클라이언트 컴포넌트
 */
export default function HallOfFameClient() {
  const t = useTranslations('HallOfFame');
  const { data, isLoading, error, getMonthlyChampions, getYearlyRace, refresh } = useHallOfFame();

  // 현재 선택된 연도 (Monthly Timeline용)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // 연도 변경 핸들러
  const handlePrevYear = useCallback(() => {
    setSelectedYear((prev) => prev - 1);
  }, []);

  const handleNextYear = useCallback(() => {
    setSelectedYear((prev) => prev + 1);
  }, []);

  // 로딩 상태 - 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <main className={styles.container}>
        <LoadingSkeleton />
      </main>
    );
  }

  // 에러 상태 - 재시도 버튼 포함
  if (error) {
    return (
      <main className={styles.container}>
        <ErrorState message={error} onRetry={refresh} />
      </main>
    );
  }

  // 데이터가 없는 경우
  if (!data) {
    return (
      <main className={styles.container}>
        <EmptyState />
      </main>
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
