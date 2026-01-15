/**
 * MarketShareChart 컴포넌트
 *
 * 소속사별 투표 점유율을 도넛 차트로 표시합니다.
 * Top 10 + 기타로 구성됩니다.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { MarketShareData } from '@/data/mock-analytics';
import styles from './MarketShareChart.module.scss';

interface MarketShareChartProps {
  /** 점유율 데이터 배열 */
  data: MarketShareData[];
}

export default function MarketShareChart({ data }: MarketShareChartProps) {
  const t = useTranslations('Analytics');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // 호버 핸들러
  const onPieEnter = useCallback((_: unknown, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  // 총 투표 수 계산
  const totalVotes = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  // 숫자 포맷팅
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('charts.market_share')}</h3>
        <p className={styles.description}>{t('charts.market_share_desc')}</p>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{
                    filter: activeIndex === null || activeIndex === index ? 'none' : 'opacity(0.4)',
                    transition: 'filter 0.2s ease',
                  }}
                />
              ))}
            </Pie>

            {/* 중앙 기본 텍스트 (호버 안 했을 때) */}
            {activeIndex === null && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                <tspan x="50%" dy="-0.5em" fill="var(--color-text)" fontSize={14} fontWeight={600}>
                  {t('stats.total_votes')}
                </tspan>
                <tspan
                  x="50%"
                  dy="1.5em"
                  fill="var(--color-primary)"
                  fontSize={16}
                  fontWeight={700}
                >
                  {formatNumber(totalVotes)}
                </tspan>
              </text>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 리스트 */}
      <div className={styles.legend}>
        {data.slice(0, 5).map((item) => (
          <div key={item.id} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: item.color }} />
            <span className={styles.legendName}>{item.name}</span>
            <span className={styles.legendPercent}>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
