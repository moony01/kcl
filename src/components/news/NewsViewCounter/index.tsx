'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { getNewsViewCount, incrementNewsView } from '@/lib/api/news-views';
import { useTranslations } from 'next-intl';
import styles from './NewsViewCounter.module.scss';

interface NewsViewCounterProps {
  /** 뉴스 slug 식별자 */
  slug: string;
  /** true면 마운트 시 조회수 증가 (상세 페이지용) */
  incrementOnMount?: boolean;
  /** 아이콘 크기 */
  iconSize?: number;
}

/**
 * 뉴스 조회수 표시 컴포넌트
 * Supabase에서 조회수를 가져와 표시
 * incrementOnMount=true면 페이지 진입 시 조회수 증가
 */
export default function NewsViewCounter({
  slug,
  incrementOnMount = false,
  iconSize = 14,
}: NewsViewCounterProps) {
  const t = useTranslations('News');
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // 조회수 증가 (fire-and-forget)
      if (incrementOnMount) {
        incrementNewsView(slug);
      }

      // 조회수 가져오기
      const count = await getNewsViewCount(slug);
      if (!cancelled) {
        // 증가 요청 후이므로 +1 보정 (incrementOnMount인 경우)
        setViewCount(incrementOnMount ? count + 1 : count);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [slug, incrementOnMount]);

  if (viewCount === null) {
    return null;
  }

  return (
    <span className={styles.viewCounter}>
      <Eye size={iconSize} />
      <span>{t('views', { count: viewCount })}</span>
    </span>
  );
}
