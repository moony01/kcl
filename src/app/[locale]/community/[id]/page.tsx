/**
 * 게시글 상세 페이지 (Server Component)
 *
 * 동적 라우트 [id]에 대해 SSG 정적 셸 생성
 * 실제 게시글 ID는 동적이므로 빈 배열 반환 (CSR fallback)
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 * @fixed setRequestLocale 호출 추가 (next-intl 정적 생성 지원)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PostDetailClient from './PostDetailClient';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** 커뮤니티 게시글은 동적으로 생성되므로 샘플 ID만 정적 생성 */
const samplePostIds = ['1', '2', '3', '4', '5'];

/**
 * 정적 경로 생성
 * 빌드 시점에는 샘플 ID만 생성, 나머지는 CSR로 처리
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.flatMap((locale) => samplePostIds.map((id) => ({ locale, id })));
}

/**
 * 게시글 상세 페이지 Props
 */
interface PostDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 canonical 및 hreflang 설정
 */
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
  const { locale, id } = await params;

  return {
    title: `Post #${id} | KCL Community`,
    alternates: generateDynamicAlternates(locale, '/community', id),
  };
}

/**
 * 게시글 상세 페이지 (정적 셸)
 * next-intl 정적 생성을 위해 setRequestLocale 호출 필수
 */
export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { locale } = await params;

  // next-intl 정적 생성 지원 - 이 호출이 없으면 404 발생 가능
  setRequestLocale(locale);

  return <PostDetailClient />;
}
