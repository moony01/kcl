/**
 * CurrentRaceChart 컴포넌트
 *
 * 현재 연도 우승 횟수 경쟁 현황을 표시하는 바 차트입니다.
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { YearlyWinCount } from '@/types/hall-of-fame';
import styles from './CurrentRaceChart.module.scss';

interface CurrentRaceChartProps {
  /** 연도 */
  year: number;
  /** 경쟁 현황 데이터 */
  data: YearlyWinCount[];
  /** 최대 우승 횟수 (바 너비 계산용) */
  maxWins?: number;
}

export default function CurrentRaceChart({ year, data, maxWins = 12 }: CurrentRaceChartProps) {
  const t = useTranslations('HallOfFame');

  // 순위별 색상
  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#D4AF37'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return '#666666';
    }
  };

  // 순위 뱃지 텍스트
  const getRankBadge = (rank: number): string => {
    switch (rank) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      default:
        return `${rank}th`;
    }
  };

  return (
    <section className={styles.container}>
      {/* 섹션 헤더 */}
      <header className={styles.header}>
        <h3 className={styles.title}>
          {year} {t('current_race')}
        </h3>
      </header>

      {/* 바 차트 */}
      <div className={styles.chartContainer}>
        {data.map((item, index) => {
          const barWidth = (item.winCount / maxWins) * 100;
          const color = getRankColor(item.rank);

          return (
            <motion.div
              key={item.companyId}
              className={styles.barRow}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              {/* 순위 뱃지 */}
              <span className={styles.rankBadge} style={{ color }}>
                {getRankBadge(item.rank)}
              </span>

              {/* 소속사 정보 */}
              <div className={styles.companyInfo}>
                <div className={styles.companyLogo} style={{ background: item.companyLogo }}>
                  <span>{item.companyName.charAt(0)}</span>
                </div>
                <span className={styles.companyName}>{item.companyName}</span>
              </div>

              {/* 바 */}
              <div className={styles.barWrapper}>
                <motion.div
                  className={styles.bar}
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              {/* 우승 횟수 */}
              <span className={styles.winCount} style={{ color }}>
                {item.winCount} {t('victories')}
              </span>
            </motion.div>
          );
        })}

        {/* 데이터 없음 */}
        {data.length === 0 && (
          <div className={styles.empty}>
            <p>{t('no_champion_yet')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
