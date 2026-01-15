"use client";

import { CompanyType } from '@/lib/mock-data';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './StockChart.module.scss';

interface StockChartProps {
  data: CompanyType['stockHistory'];
  color: string;
}

export default function StockChart({ data, color: gradientString }: StockChartProps) {
  // Extract major color from gradient string for the chart
  // e.g. "linear-gradient(135deg, #E1D91A 0%, #1A1A1A 100%)" -> "#E1D91A"
  const strokeColor = gradientString.match(/#[a-fA-F0-9]{6}/)?.[0] || '#8884d8';

  return (
    <div className={styles.chartContainer}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            hide 
          />
          <YAxis 
            hide 
            domain={['dataMin', 'dataMax']} 
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', background: 'rgba(20,20,20, 0.9)', color: '#fff' }}
            formatter={(value: number | undefined) => [value?.toLocaleString() ?? '0', 'Firepower']}
            labelFormatter={(label) => label}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={strokeColor} 
            fillOpacity={1} 
            fill="url(#colorValue)" 
            strokeWidth={3}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
