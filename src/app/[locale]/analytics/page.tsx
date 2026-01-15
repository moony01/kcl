/**
 * Analytics 페이지
 *
 * 투표 데이터 기반의 시각화된 통계 및 트렌드 분석 페이지입니다.
 *
 * 주요 기능:
 * - 기간별 필터 (오늘/7일/30일/전체)
 * - 실시간 트렌드 차트 (LineChart)
 * - 소속사별 점유율 (DonutChart)
 * - 급상승 소속사 Top 5
 */

'use client';

export const runtime = 'edge';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, Clock } from 'lucide-react';

// Feature Components
import {
  PeriodFilter,
  TrendChart,
  MarketShareChart,
  RisingCompanies,
} from '@/components/features/analytics';

// Mock Data
import {
  type PeriodType,
  generateTrendData,
  generateMarketShareData,
  generateRisingCompanies,
} from '@/data/mock-analytics';

import styles from './page.module.scss';

export default function AnalyticsPage() {
  const t = useTranslations('Analytics');

  // 기간 필터 상태
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');

  // 기간 변경 핸들러
  const handlePeriodChange = useCallback((period: PeriodType) => {
    setSelectedPeriod(period);
  }, []);

  // 데이터 생성 (Memoized)
  const trendData = useMemo(() => generateTrendData(selectedPeriod), [selectedPeriod]);

  const marketShareData = useMemo(() => generateMarketShareData(), []);

  const risingCompanies = useMemo(() => generateRisingCompanies(selectedPeriod), [selectedPeriod]);

  // 마지막 업데이트 시간 (Mock 데이터는 항상 5분 전)
  const lastUpdated = t('minutes_ago', { minutes: 5 });

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <BarChart3 size={24} className={styles.icon} />
          <div>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>{t('subtitle')}</p>
          </div>
        </div>

        {/* 기간 필터 */}
        <div className={styles.filterWrapper}>
          <PeriodFilter selected={selectedPeriod} onChange={handlePeriodChange} />
        </div>
      </header>

      {/* 차트 그리드 */}
      <div className={styles.chartsGrid}>
        {/* 실시간 트렌드 차트 (가로 전체) */}
        <section className={styles.trendSection}>
          <TrendChart data={trendData} />
        </section>

        {/* 2열 레이아웃: 점유율 + 급상승 */}
        <div className={styles.twoColumnLayout}>
          <section className={styles.marketShareSection}>
            <MarketShareChart data={marketShareData} />
          </section>

          <section className={styles.risingSection}>
            <RisingCompanies data={risingCompanies} />
          </section>
        </div>
      </div>

      {/* 푸터: 마지막 업데이트 시간 */}
      <footer className={styles.footer}>
        <Clock size={14} />
        <span>
          {t('last_updated')}: {lastUpdated}
        </span>
      </footer>
    </main>
  );
}
