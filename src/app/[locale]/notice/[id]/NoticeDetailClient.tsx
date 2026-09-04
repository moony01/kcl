'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import {
  getAnnouncementById,
  getAnnouncementSeoLocale,
  incrementAnnouncementView,
} from '@/lib/api/announcements';
import { JsonLd } from '@/components/common/JsonLd';
import NoticeComments from '@/components/features/notice/NoticeComments';
import AdBanner from '@/components/common/AdBanner';
import { AD_SLOTS } from '@/types/ads';
import type { Announcement } from '@/types/announcement';
import { BRAND_MARK_PATH, BRAND_NAME } from '@/lib/brand';
import { FULL_URL } from '@/lib/constants';
import styles from './page.module.scss';

interface NoticeDetailClientProps {
  locale: string;
  noticeId: string;
}

/**
 * 공지사항 상세 클라이언트 컴포넌트
 * 개별 공지사항 데이터를 Supabase에서 조회하여 렌더링
 */
export default function NoticeDetailClient({ locale, noticeId }: NoticeDetailClientProps) {
  const t = useTranslations('Notice');

  const [notice, setNotice] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /** 공지사항 상세 데이터 조회 */
  useEffect(() => {
    async function fetchNotice() {
      try {
        setLoading(true);
        setError(false);
        const data = await getAnnouncementById(noticeId, locale);
        if (data) {
          setNotice(data);
          // 조회수 증가 (fire-and-forget)
          incrementAnnouncementView(noticeId);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchNotice();
  }, [noticeId, locale]);

  /** 날짜 포맷팅 */
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-CA');
  };

  /** 카테고리 라벨 매핑 */
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      notice: t('category_notice'),
      update: t('category_update'),
      event: t('category_event'),
    };
    return labels[category] || category;
  };

  const seoLocale = getAnnouncementSeoLocale(noticeId, locale);
  const canonical = `${FULL_URL}/${seoLocale}/notice/${noticeId}`;

  return (
    <div className={styles.noticePage}>
      <div className={styles.container}>
        {/* 목록으로 돌아가기 */}
        <Link href={`/${locale}/notice`} className={styles.backButton}>
          <ArrowLeft size={16} />
          <span>{t('back_to_list')}</span>
        </Link>

        {/* 로딩 상태 */}
        {loading && (
          <div className={styles.statusMessage}>
            <p>{t('loading')}</p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className={styles.statusMessage}>
            <p>{t('error')}</p>
            <Link href={`/${locale}/notice`} className={styles.retryButton}>
              {t('back_to_list')}
            </Link>
          </div>
        )}

        {/* 상세 내용 */}
        {notice && !loading && (
          <>
            {/* 공지 헤더 */}
            <div className={styles.detailHeader}>
              <span className={`${styles.categoryBadge} ${styles[notice.category]}`}>
                {getCategoryLabel(notice.category)}
              </span>
              <h2 className={styles.detailTitle}>{notice.title}</h2>
              <div className={styles.detailMeta}>
                <span>{formatDate(notice.created_at)}</span>
                <span>{t('views', { count: notice.view_count })}</span>
              </div>
            </div>

            {/* 본문 (Quill HTML 콘텐츠) */}
            {/* XSS 방지: DOMPurify로 HTML sanitize 처리 */}
            <div
              className={`${styles.detailContent} ql-editor`}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(notice.content),
              }}
            />

            {/* JSON-LD 구조화 데이터 (Article 스키마) */}
            <JsonLd
              data={{
                '@context': 'https://schema.org',
                '@type': 'Article',
                headline: notice.title,
                datePublished: notice.created_at,
                dateModified: notice.updated_at,
                url: canonical,
                inLanguage: seoLocale,
                author: {
                  '@type': 'Organization',
                  name: BRAND_NAME,
                },
                publisher: {
                  '@type': 'Organization',
                  name: BRAND_NAME,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${FULL_URL}${BRAND_MARK_PATH}`,
                  },
                },
              }}
            />

            {/* 공지사항 상세 광고 */}
            <AdBanner adSlot={AD_SLOTS.NOTICE_DETAIL_ARTICLE} adFormat="in-article" />

            {/* 공지사항 댓글 섹션 */}
            <NoticeComments announcementId={noticeId} />
          </>
        )}
      </div>
    </div>
  );
}
