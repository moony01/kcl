/**
 * Analytics 페이지 (Server Component)
 *
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import AnalyticsClient from './AnalyticsClient';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * Analytics 페이지 (정적 셸)
 */
export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
