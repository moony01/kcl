'use client';

import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';
import styles from './NewsCard.module.scss';

/**
 * NewsCard 컴포넌트 Props
 */
interface NewsCardProps {
  /** URL용 식별자 */
  slug: string;
  /** 기사 제목 */
  title: string;
  /** 기사 요약문 */
  excerpt: string;
  /** 작성일 (YYYY-MM-DD) */
  date: string;
  /** 카테고리 */
  category?: string;
  /** 썸네일 이미지 경로 */
  thumbnail?: string;
  /** 언어 코드 */
  locale: string;
}

/**
 * 뉴스 카드 컴포넌트
 * 뉴스 목록 페이지에서 각 기사를 카드 형태로 표시
 */
export default function NewsCard({
  slug,
  title,
  excerpt,
  date,
  category = 'General',
  thumbnail,
  locale,
}: NewsCardProps) {
  // 날짜 포맷팅 (YYYY-MM-DD → 로케일에 맞게)
  const formattedDate = new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/${locale}/news/${slug}`} className={styles.card}>
      {/* 썸네일 영역 */}
      <div className={styles.thumbnailWrapper}>
        {thumbnail ? (
          <img src={thumbnail} alt={title} className={styles.thumbnail} />
        ) : (
          <div className={styles.placeholderThumbnail}>
            <span>📰</span>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className={styles.content}>
        {/* 카테고리 뱃지 */}
        <div className={styles.category}>
          <Tag size={12} />
          <span>{category}</span>
        </div>

        {/* 제목 */}
        <h3 className={styles.title}>{title}</h3>

        {/* 요약문 */}
        <p className={styles.excerpt}>{excerpt}</p>

        {/* 날짜 */}
        <div className={styles.date}>
          <Calendar size={14} />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
}
