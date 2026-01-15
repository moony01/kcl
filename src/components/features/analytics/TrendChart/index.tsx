/**
 * TrendChart 컴포넌트
 *
 * 실시간 투표 트렌드를 표시하는 라인 차트입니다.
 * Top 5 소속사의 시간별/일별 투표 추이를 시각화합니다.
 */

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendDataPoint } from '@/data/mock-analytics';
import { getTop5Companies, CHART_COLORS } from '@/data/mock-analytics';
import styles from './TrendChart.module.scss';

interface TrendChartProps {
  /** 트렌드 데이터 배열 */
  data: TrendDataPoint[];
}

// 숫자 포맷팅 (K, M 단위) - 컴포넌트 외부에 정의
const formatValue = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

// 커스텀 툴팁 - 컴포넌트 외부에 정의
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className={styles.tooltipItem}>
          <span className={styles.tooltipColor} style={{ backgroundColor: entry.color }} />
          <span className={styles.tooltipName}>{entry.name}</span>
          <span className={styles.tooltipValue}>{formatValue(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// 커스텀 범례 - 컴포넌트 외부에 정의
function CustomLegend() {
  const companies = getTop5Companies();

  return (
    <div className={styles.legend}>
      {companies.map((company, index) => (
        <div key={company.id} className={styles.legendItem}>
          <span className={styles.legendColor} style={{ backgroundColor: CHART_COLORS[index] }} />
          <span className={styles.legendName}>{company.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function TrendChart({ data }: TrendChartProps) {
  const t = useTranslations('Analytics');

  // Top 5 회사 정보 (차트 라인용)
  const companies = useMemo(() => getTop5Companies(), []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('charts.trend')}</h3>
        <p className={styles.description}>{t('charts.trend_desc')}</p>
      </div>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              stroke="var(--color-text-dim)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--color-text-dim)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatValue}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />

            {companies.map((company, index) => (
              <Line
                key={company.id}
                type="monotone"
                dataKey={company.id}
                name={company.name}
                stroke={CHART_COLORS[index]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: CHART_COLORS[index],
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
