/**
 * HomePage (리그 시스템)
 *
 * KCL 리그 시스템 메인 페이지
 * SSG 빌드 시 정적 셸 생성, 데이터는 CSR(SWR)로 로드
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import { HomeClient } from './HomeClient';

/** 지원하는 12개 언어에 대해 정적 페이지 생성 */
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/**
 * 홈페이지 (정적 셸)
 * 서버에서 데이터를 fetching하지 않음
 * HomeClient가 SWR로 클라이언트에서 데이터 로드
 */
export default function HomePage() {
  return <HomeClient />;
}
