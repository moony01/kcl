import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getNewsBySlug, getAllNewsParams, getRelatedNews } from '@/lib/news';
import { generateDynamicAlternates } from '@/lib/seo';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import { JsonLd } from '@/components/common/JsonLd';
import ShareButtons from '@/components/common/ShareButtons';
import NewsViewCounter from '@/components/news/NewsViewCounter';
import NewsComments from '@/components/news/NewsComments';
import RelatedNewsGrid from '@/components/news/RelatedNewsGrid';
import AdBanner from '@/components/common/AdBanner';
import { AD_SLOTS } from '@/types/ads';
import styles from './page.module.scss';

/**
 * 마크다운 콘텐츠를 ## (h2) 기준으로 섹션 분할
 * 도입부(## 이전)와 각 ## 섹션을 별도 문자열 배열로 반환
 * 광고를 섹션 사이에 삽입하기 위해 사용
 */
function splitContentBySections(content: string): string[] {
  const sections = content.split(/(?=^## )/m);
  return sections.filter((s) => s.trim());
}

/** 광고를 삽입할 섹션 인덱스 (0-based, 해당 섹션 뒤에 광고 배치) */
const AD_INSERT_AFTER_SECTIONS = [1, 3];

/**
 * 제목을 지정된 최대 길이로 truncate
 * SEO 권장: title 태그는 55자 이내
 */
function truncateTitle(title: string, maxLength: number = 55): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + '...';
}

/**
 * 정적 경로 생성
 * 12개 언어 × 모든 뉴스 slug 조합
 */
export function generateStaticParams() {
  return getAllNewsParams(SUPPORTED_LOCALES as unknown as string[]);
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
 * SEO를 위한 동적 title, description, canonical, hreflang 설정
 */
export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getNewsBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Not Found',
    };
  }

  // SEO 최적화: title은 55자, og:title은 전체 제목 사용
  const truncatedTitle = truncateTitle(post.title, 55);

  return {
    title: `${truncatedTitle} | KCL News`,
    description: post.excerpt,
    openGraph: {
      title: post.title, // OG 태그는 전체 제목 허용 (70자까지)
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
    alternates: generateDynamicAlternates(locale, '/news', slug),
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
              <Image
              src={post.thumbnail}
              alt={post.title}
              width={1200}
              height={630}
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
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

        {/* 메타 정보 (날짜 + 조회수 + 공유 버튼) */}
        <div className={styles.meta}>
          <div className={styles.metaLeft}>
            <div className={styles.date}>
              <Calendar size={16} />
              <time dateTime={post.date}>{formattedDate}</time>
            </div>
            <NewsViewCounter slug={slug} incrementOnMount />
          </div>
          <ShareButtons
            title={post.title}
            url={`https://www.kclhq.com/${locale}/news/${slug}`}
            description={post.excerpt}
            imageUrl={post.thumbnail ? `https://www.kclhq.com${post.thumbnail}` : undefined}
            size="sm"
          />
        </div>
      </header>

      {/* 기사 본문 (섹션별 분할 + 중간 광고 삽입) */}
      <article className={styles.content}>
        {(() => {
          const sections = splitContentBySections(post.content);
          // 마크다운 이미지를 ExportedImage로 최적화하는 공용 컴포넌트
          const markdownComponents: Partial<Components> = {
            img: ({ src, alt }) => {
              if (typeof src === 'string' && src) {
                return (
                  <span className={styles.contentImage}>
                    <Image
                      src={src}
                      alt={alt || ''}
                      width={800}
                      height={450}
                      sizes="(max-width: 768px) 100vw, 800px"
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </span>
                );
              }
              return null;
            },
          };

          return sections.map((section, index) => (
            <div key={index}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {section}
              </ReactMarkdown>
              {/* 지정된 섹션 뒤에 in-article 광고 삽입 (마지막 섹션 제외) */}
              {AD_INSERT_AFTER_SECTIONS.includes(index) && index < sections.length - 1 && (
                <AdBanner adSlot={AD_SLOTS.NEWS_DETAIL_ARTICLE} adFormat="in-article" />
              )}
            </div>
          ));
        })()}
      </article>

      {/* 기사 하단 공유 버튼 */}
      <div className={styles.shareSection}>
        <p className={styles.sharePrompt}>{t('sharePrompt')}</p>
        <ShareButtons
          title={post.title}
          url={`https://www.kclhq.com/${locale}/news/${slug}`}
          description={post.excerpt}
          imageUrl={post.thumbnail ? `https://www.kclhq.com${post.thumbnail}` : undefined}
          size="md"
        />
      </div>

      {/* 관련 뉴스 (크로스 프로모션) - 조회수/댓글수 포함 */}
      {(() => {
        const relatedPosts = getRelatedNews(slug, locale, 3, post.category);
        if (relatedPosts.length === 0) return null;
        return (
          <section className={styles.relatedSection}>
            <h3 className={styles.relatedTitle}>{t('relatedNews')}</h3>
            <RelatedNewsGrid
              posts={relatedPosts.map((r) => ({
                slug: r.slug,
                title: r.title,
                date: r.date,
                category: r.category,
                thumbnail: r.thumbnail ?? undefined,
              }))}
              locale={locale}
            />
          </section>
        );
      })()}

      {/* 댓글 섹션 */}
      <NewsComments slug={slug} />

      {/* 뉴스 상세 하단 광고 */}
      <AdBanner adSlot={AD_SLOTS.NEWS_DETAIL_BOTTOM} adFormat="leaderboard" />

      {/* JSON-LD 구조화 데이터 (Article 스키마) */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          url: `https://www.kclhq.com/${locale}/news/${slug}`,
          datePublished: post.date,
          image: post.thumbnail || 'https://www.kclhq.com/images/logo.png',
          author: {
            '@type': 'Organization',
            name: 'KCL',
          },
          publisher: {
            '@type': 'Organization',
            name: 'KCL - K-pop Company League',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.kclhq.com/images/logo.png',
            },
          },
        }}
      />
    </main>
  );
}
