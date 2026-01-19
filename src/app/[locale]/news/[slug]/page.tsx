import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNewsBySlug, getAllNewsParams } from '@/lib/news';
import styles from './page.module.scss';

/** 지원하는 12개 언어 */
const locales = ['ko', 'en', 'id', 'tr', 'ja', 'zh', 'es', 'pt', 'th', 'vi', 'fr', 'de'];

/**
 * 정적 경로 생성
 * 12개 언어 × 모든 뉴스 slug 조합
 */
export function generateStaticParams() {
  return getAllNewsParams(locales);
}

/**
 * 뉴스 상세 페이지 Props
 */
interface NewsDetailPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 동적 title, description 설정
 */
export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getNewsBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${post.title} | KCL News`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

/**
 * 뉴스 상세 페이지
 * 마크다운 본문을 렌더링하여 기사 전문 표시
 */
export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { locale, slug } = await params;

  // next-intl 정적 생성 지원
  setRequestLocale(locale);

  // 번역 가져오기
  const t = await getTranslations({ locale, namespace: 'News' });

  // 뉴스 데이터 가져오기 (async 함수)
  const post = await getNewsBySlug(slug, locale);

  // 뉴스가 없으면 404
  if (!post) {
    notFound();
  }

  // 날짜 포맷팅
  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className={styles.container}>
      {/* 뒤로가기 링크 */}
      <Link href={`/${locale}/news`} className={styles.backLink}>
        <ArrowLeft size={18} />
        <span>{t('backToList')}</span>
      </Link>

      {/* 기사 헤더 */}
      <header className={styles.header}>
        {/* 히어로 이미지 (썸네일 또는 placeholder) */}
        <div className={styles.heroImage}>
          {post.thumbnail ? (
            <img src={post.thumbnail} alt={post.title} />
          ) : (
            <div className={styles.heroPlaceholder}>
              <span>📰</span>
            </div>
          )}
        </div>

        {/* 카테고리 */}
        <div className={styles.category}>
          <Tag size={14} />
          <span>{post.category}</span>
        </div>

        {/* 제목 */}
        <h1 className={styles.title}>{post.title}</h1>

        {/* 날짜 */}
        <div className={styles.date}>
          <Calendar size={16} />
          <time dateTime={post.date}>{formattedDate}</time>
        </div>
      </header>

      {/* 기사 본문 */}
      <article className={styles.content}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </article>

      {/* 광고 플레이스홀더 (향후 AdSense 삽입 위치) */}
      <div className={styles.adPlaceholder} data-ad-slot="news-detail-bottom">
        {/* AdSense 코드 삽입 예정 */}
      </div>

      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: {
              '@type': 'Organization',
              name: 'KCL',
            },
            publisher: {
              '@type': 'Organization',
              name: 'KCL - K-pop Company League',
            },
          }),
        }}
      />
    </main>
  );
}
