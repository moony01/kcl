'use client';

import { useState, useEffect } from 'react';
import { getNewsCommentCounts } from '@/lib/api/news-comments';
import NewsCard from '@/components/news/NewsCard';

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

/**
 * 뉴스 그리드 클라이언트 컴포넌트
 * 배치로 댓글 수를 조회하여 각 NewsCard에 전달
 */
export default function NewsGridClient({ posts, locale }: NewsGridClientProps) {
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (posts.length === 0) return;

    const slugs = posts.map((p) => p.slug);
    getNewsCommentCounts(slugs).then(setCommentCounts);
  }, [posts]);

  return (
    <>
      {posts.map((post) => (
        <NewsCard
          key={post.slug}
          slug={post.slug}
          title={post.title}
          excerpt={post.excerpt}
          date={post.date}
          category={post.category}
          thumbnail={post.thumbnail}
          locale={locale}
          commentCount={commentCounts[post.slug] ?? 0}
        />
      ))}
    </>
  );
}
