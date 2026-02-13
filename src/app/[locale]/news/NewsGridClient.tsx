'use client';

/**
 * 뉴스 그리드 클라이언트 컴포넌트
 *
 * 카테고리 탭 필터링 + 배치 댓글 수 조회
 * 뉴스 카드 3개 후 in-feed 광고 삽입
 * 공지사항 페이지의 CategoryFilter 패턴 참조
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import classNames from 'classnames';
import { getNewsCommentCounts } from '@/lib/api/news-comments';
import NewsCard from '@/components/news/NewsCard';
import AdBanner from '@/components/common/AdBanner';
import { AD_SLOTS } from '@/types/ads';
import styles from './NewsGridClient.module.scss';

interface NewsPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category?: string;
  thumbnail?: string;
}

interface NewsGridClientProps {
  posts: NewsPost[];
  locale: string;
}

export default function NewsGridClient({ posts, locale }: NewsGridClientProps) {
  const t = useTranslations('News');
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // 댓글 수 배치 조회
  useEffect(() => {
    if (posts.length === 0) return;
    const slugs = posts.map((p) => p.slug);
    getNewsCommentCounts(slugs).then(setCommentCounts);
  }, [posts]);

  // 뉴스에서 고유 카테고리 추출 (출현 빈도순 정렬)
  const categories = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const post of posts) {
      const cat = post.category || 'General';
      countMap[cat] = (countMap[cat] || 0) + 1;
    }
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .map(([cat]) => cat);
  }, [posts]);

  // 선택된 카테고리로 필터링
  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((p) => (p.category || 'General') === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <>
      {/* 카테고리 탭 필터 */}
      {categories.length > 1 && (
        <div className={styles.categoryFilter}>
          {/* 전체 탭 */}
          <button
            className={classNames(styles.filterButton, {
              [styles.active]: selectedCategory === null,
            })}
            onClick={() => setSelectedCategory(null)}
          >
            {t('category_all')}
          </button>
          {/* 개별 카테고리 탭 */}
          {categories.map((cat) => (
            <button
              key={cat}
              className={classNames(styles.filterButton, {
                [styles.active]: selectedCategory === cat,
              })}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* 뉴스 카드 그리드 + in-feed 광고 (3번째 카드 후 삽입) */}
      {filteredPosts.map((post, index) => (
        <React.Fragment key={post.slug}>
          <NewsCard
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            date={post.date}
            category={post.category}
            thumbnail={post.thumbnail}
            locale={locale}
            commentCount={commentCounts[post.slug] ?? 0}
          />
          {/* 3번째 카드 뒤에 in-feed 광고 삽입 (전체 너비) */}
          {index === 2 && filteredPosts.length > 3 && (
            <div className={styles.inFeedAd}>
              <AdBanner adSlot={AD_SLOTS.NEWS_LIST_BOTTOM} adFormat="leaderboard" />
            </div>
          )}
        </React.Fragment>
      ))}

      {/* 필터링 결과 없음 */}
      {filteredPosts.length === 0 && selectedCategory && (
        <div className={styles.noResults}>
          <p>{t('noArticles')}</p>
        </div>
      )}
    </>
  );
}
