/**
 * 게시글 상세 페이지 (Server Component)
 *
 * 동적 라우트 [id]에 대해 SSG 정적 셸 생성
 * 실제 게시글 ID는 동적이므로 빈 배열 반환 (CSR fallback)
 *
 * @updated Phase 5 - SSG/CSR 마이그레이션
 */

import PostDetailClient from './PostDetailClient';

/** 지원하는 12개 언어 */
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

/**
 * 정적 경로 생성
 * 게시글 ID는 동적이므로 언어별 기본 페이지만 생성
 * SSG export에서는 알려진 ID가 없으므로 빈 배열 반환 불가
 * → 샘플 ID들로 정적 생성
 */
export function generateStaticParams() {
  // 커뮤니티 게시글은 동적으로 생성되므로 샘플 ID만 정적 생성
  const samplePostIds = ['1', '2', '3', '4', '5'];

  return locales.flatMap((locale) => samplePostIds.map((id) => ({ locale, id })));
}

/**
 * 게시글 상세 페이지 (정적 셸)
 */
export default function PostDetailPage() {
  return <PostDetailClient />;
}
