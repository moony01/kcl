'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { getAnnouncements, getAnnouncementById, incrementAnnouncementView } from '@/lib/api/announcements';
import type { Announcement, AnnouncementCategory, AnnouncementListItem } from '@/types/announcement';
import NoticeList from '@/components/features/notice/NoticeList';
import NoticeDetail from '@/components/features/notice/NoticeDetail';
import CategoryFilter from '@/components/features/notice/CategoryFilter';
import styles from './page.module.scss';

interface NoticeClientProps {
  locale: string;
}

/**
 * 공지사항 클라이언트 컴포넌트
 * 목록 조회 + 인라인 상세보기 (SSG 제약으로 별도 라우트 대신 인라인)
 */
export default function NoticeClient({ locale }: NoticeClientProps) {
  const t = useTranslations('Notice');

  const [notices, setNotices] = useState<AnnouncementListItem[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);

  /** 공지사항 목록 조회 */
  const fetchNotices = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getAnnouncements(selectedCategory);
      setNotices(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  /** 공지사항 상세 조회 (인라인 펼침) */
  const handleSelectNotice = async (id: string) => {
    // 이미 선택된 공지를 다시 클릭하면 닫기
    if (selectedNotice?.id === id) {
      setSelectedNotice(null);
      return;
    }

    try {
      setDetailLoading(true);
      const detail = await getAnnouncementById(id);
      if (detail) {
        setSelectedNotice(detail);
        // 조회수 증가 (fire-and-forget)
        incrementAnnouncementView(id);
      }
    } catch {
      // 상세 조회 실패 시 무시
    } finally {
      setDetailLoading(false);
    }
  };

  /** 목록으로 돌아가기 */
  const handleBackToList = () => {
    setSelectedNotice(null);
  };

  /** 카테고리 필터 변경 */
  const handleCategoryChange = (category?: AnnouncementCategory) => {
    setSelectedCategory(category);
    setSelectedNotice(null);
  };

  return (
    <div className={styles.noticePage}>
      <div className={styles.container}>
        {/* 페이지 헤더 */}
        <header className={styles.header}>
          <h2 className={styles.title}>{t('title')}</h2>
          <p className={styles.subtitle}>{t('subtitle')}</p>
        </header>

        {/* 카테고리 필터 */}
        <CategoryFilter
          selected={selectedCategory}
          onChange={handleCategoryChange}
        />

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
            <button className={styles.retryButton} onClick={fetchNotices}>
              {t('retry')}
            </button>
          </div>
        )}

        {/* 공지사항 목록 */}
        {!loading && !error && (
          <>
            {notices.length === 0 ? (
              <div className={styles.statusMessage}>
                <p>{t('no_notices')}</p>
              </div>
            ) : (
              <NoticeList
                notices={notices}
                selectedId={selectedNotice?.id}
                onSelect={handleSelectNotice}
              />
            )}
          </>
        )}

        {/* 인라인 상세보기 */}
        {selectedNotice && (
          <NoticeDetail
            notice={selectedNotice}
            loading={detailLoading}
            onBack={handleBackToList}
          />
        )}
      </div>
    </div>
  );
}
