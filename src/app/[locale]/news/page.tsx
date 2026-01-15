import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Newspaper } from 'lucide-react';
import { getAllNews } from '@/lib/news';
import NewsCard from '@/components/news/NewsCard';
import styles from './page.module.scss';

/**
 * 뉴스 목록 페이지 Props
 */
interface NewsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * 페이지 메타데이터 생성
 * SEO를 위한 title, description 설정
 */

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'News' });

  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
    },
  };
}

/**
 * 뉴스 목록 페이지
 * K-Pop 산업 관련 뉴스 및 분석 리포트 목록 표시
 */
export default async function NewsPage({ params }: NewsPageProps) {
  const { locale } = await params;

  // next-intl 정적 생성 지원
  setRequestLocale(locale);

  // 번역 가져오기
  const t = await getTranslations({ locale, namespace: 'News' });

  // 뉴스 데이터 가져오기
  const posts = getAllNews(locale);

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <Newspaper size={32} className={styles.icon} />
          <h1 className={styles.title}>{t('title')}</h1>
        </div>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* 뉴스 그리드 */}
      {posts.length > 0 ? (
        <section className={styles.grid}>
          {posts.map((post) => (
            <NewsCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              category={post.category}
              thumbnail={post.thumbnail ?? undefined}
              locale={locale}
            />
          ))}
        </section>
      ) : (
        <div className={styles.empty}>
          <p>{t('noArticles')}</p>
        </div>
      )}

      {/* 광고 플레이스홀더 (향후 AdSense 삽입 위치) */}
      <div className={styles.adPlaceholder} data-ad-slot="news-list-bottom">
        {/* AdSense 코드 삽입 예정 */}
      </div>
    </main>
  );
}
