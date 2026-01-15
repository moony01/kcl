/**
 * Analytics Mock 데이터
 *
 * 통계 페이지에서 사용할 시각화용 샘플 데이터입니다.
 * 실제 API 연동 전까지 사용됩니다.
 */

import { MOCK_COMPANIES } from '@/lib/mock-data';

// 기간 타입 정의
export type PeriodType = 'today' | 'week' | 'month' | 'all';

// 트렌드 데이터 포인트 타입
export interface TrendDataPoint {
  date: string;
  timestamp: number;
  [companyId: string]: number | string; // 회사별 투표 수
}

// 점유율 데이터 타입
export interface MarketShareData {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number; // Recharts 호환을 위한 인덱스 시그니처
}

// 급상승 회사 타입
export interface RisingCompany {
  id: string;
  name: string;
  currentVotes: number;
  previousVotes: number;
  change: number;
  changePercent: number;
  rank: number;
  previousRank: number;
  color: string;
}

/**
 * 회사 색상 추출 헬퍼
 * gradient 문자열에서 첫 번째 hex 컬러 추출
 */
const extractColor = (gradient: string): string => {
  const match = gradient.match(/#[a-fA-F0-9]{6}/);
  return match ? match[0] : '#8B5CF6';
};

/**
 * 실시간 트렌드 데이터 생성
 * Top 5 회사의 시간별/일별 투표 추이
 */
export const generateTrendData = (period: PeriodType): TrendDataPoint[] => {
  const top5 = MOCK_COMPANIES.slice(0, 5);
  const data: TrendDataPoint[] = [];
  const now = new Date();

  // 기간별 데이터 포인트 수 결정
  let points: number;
  let intervalMs: number;
  let dateFormat: (d: Date) => string;

  switch (period) {
    case 'today':
      points = 24; // 24시간
      intervalMs = 60 * 60 * 1000; // 1시간
      dateFormat = (d) => `${d.getHours().toString().padStart(2, '0')}:00`;
      break;
    case 'week':
      points = 7; // 7일
      intervalMs = 24 * 60 * 60 * 1000;
      dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      break;
    case 'month':
      points = 30; // 30일
      intervalMs = 24 * 60 * 60 * 1000;
      dateFormat = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      break;
    case 'all':
    default:
      points = 12; // 12개월
      intervalMs = 30 * 24 * 60 * 60 * 1000;
      dateFormat = (d) => `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      break;
  }

  // 기준값 (회사별 firepower를 시간 단위로 분배)
  const baseValues = top5.map((c) => Math.floor(c.firepower / points));

  for (let i = points - 1; i >= 0; i--) {
    const pointDate = new Date(now.getTime() - i * intervalMs);
    const point: TrendDataPoint = {
      date: dateFormat(pointDate),
      timestamp: pointDate.getTime(),
    };

    top5.forEach((company, idx) => {
      // 랜덤 변동 추가 (-10% ~ +15%)
      const variation = 0.9 + Math.random() * 0.25;
      // 시간이 지날수록 약간 증가하는 트렌드
      const trend = 1 + (points - i) * 0.02;
      point[company.id] = Math.floor(baseValues[idx] * variation * trend);
    });

    data.push(point);
  }

  return data;
};

/**
 * 소속사별 점유율 데이터 생성
 * Top 10 + 기타
 */
export const generateMarketShareData = (): MarketShareData[] => {
  const top10 = MOCK_COMPANIES.slice(0, 10);
  const others = MOCK_COMPANIES.slice(10);

  const totalVotes = MOCK_COMPANIES.reduce((sum, c) => sum + c.firepower, 0);
  const othersVotes = others.reduce((sum, c) => sum + c.firepower, 0);

  const data: MarketShareData[] = top10.map((company) => ({
    id: company.id,
    name: company.name.en,
    value: company.firepower,
    percentage: Math.round((company.firepower / totalVotes) * 1000) / 10,
    color: extractColor(company.image),
  }));

  // "기타" 항목 추가
  if (othersVotes > 0) {
    data.push({
      id: 'others',
      name: 'Others',
      value: othersVotes,
      percentage: Math.round((othersVotes / totalVotes) * 1000) / 10,
      color: '#6B7280', // gray
    });
  }

  return data;
};

/**
 * 급상승 소속사 Top 5 데이터 생성
 */
export const generateRisingCompanies = (_period: PeriodType): RisingCompany[] => {
  // 상승폭이 있는 회사들 시뮬레이션 (period는 추후 API 연동 시 사용)
  const risingCandidates = MOCK_COMPANIES.map((company) => {
    // 랜덤 상승폭 (-20% ~ +50%)
    const changePercent = Math.floor(Math.random() * 70) - 20;
    const previousVotes = Math.floor(company.firepower / (1 + changePercent / 100));
    const change = company.firepower - previousVotes;

    return {
      id: company.id,
      name: company.name.en,
      currentVotes: company.firepower,
      previousVotes,
      change,
      changePercent,
      rank: company.rank,
      previousRank: company.rank + Math.floor(Math.random() * 3) - 1,
      color: extractColor(company.image),
    };
  })
    .filter((c) => c.changePercent > 0) // 상승한 회사만
    .sort((a, b) => b.changePercent - a.changePercent) // 상승률 순
    .slice(0, 5);

  return risingCandidates;
};

/**
 * Top 5 회사 정보 (차트 범례용)
 */
export const getTop5Companies = () => {
  return MOCK_COMPANIES.slice(0, 5).map((company) => ({
    id: company.id,
    name: company.name.en,
    color: extractColor(company.image),
  }));
};

/**
 * 차트 색상 팔레트 (Top 5용)
 */
export const CHART_COLORS = [
  '#E1D91A', // HYBE (Gold)
  '#FF66A0', // SM (Pink)
  '#00B9F1', // JYP (Blue)
  '#444444', // YG (Black/Gray)
  '#9C27B0', // Starship (Purple)
];

/**
 * 데이터 갱신 시간 (Mock)
 */
export const getLastUpdatedTime = (): Date => {
  // 5분 전
  return new Date(Date.now() - 5 * 60 * 1000);
};
