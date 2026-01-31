/**
 * 게시글 상세 페이지 (Server Component)
 *
 * 동적 라우트 [id]에 대해 SSG 정적 생성
 * 빌드 시점에 DB에서 모든 게시글 ID를 가져와 정적 페이지 생성
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 * @fixed setRequestLocale 호출 추가 (next-intl 정적 생성 지원)
 * @fixed 빌드 시 DB에서 모든 게시글 ID 조회 (정적 생성)
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PostDetailClient from './PostDetailClient';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { getAllPostIds } from '@/lib/api/community';

/**
 * 정적 경로 생성
 * 빌드 시점에 DB에서 모든 게시글 ID를 조회하여 정적 페이지 생성
 */
export async function generateStaticParams() {
  const postIds = await getAllPostIds();

  // 각 로케일 × 각 게시글 ID 조합으로 정적 페이지 생성
  return SUPPORTED_LOCALES.flatMap((locale) => postIds.map((id) => ({ locale, id })));
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
