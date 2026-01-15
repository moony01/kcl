/**
 * Company Detail Page (Server Component)
 *
 * 소속사 상세 페이지 서버 컴포넌트
 * 동적 렌더링으로 변경하여 실시간 DB 데이터 반영
 *
 * @updated T1.10 - 정적 생성 → 동적 렌더링 (Supabase 연동)
 */

import CompanyDetailClient from './CompanyDetailClient';
import { use } from 'react';
import { setRequestLocale } from 'next-intl/server';

/**
 * 동적 렌더링 강제 (실시간 DB 데이터 반영)
 * generateStaticParams 제거하고 SSR로 전환
 */
export const dynamic = 'force-dynamic';

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  // Next.js 15+ params 비동기 처리
  const { locale, id } = use(params);

  // Enable static rendering for locale
  setRequestLocale(locale);

  // 클라이언트 컴포넌트에서 데이터 로딩 처리
  // (SWR을 통한 클라이언트 사이드 데이터 페칭)
  return <CompanyDetailClient locale={locale} id={id} />;
}
