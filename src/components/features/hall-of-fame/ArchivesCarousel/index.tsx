/**
 * ArchivesCarousel 컴포넌트
 *
 * 역대 연간 대상 수상자를 캐러셀/슬라이더로 표시합니다.
 */

'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import type { GrandChampion } from '@/types/hall-of-fame';
import styles from './ArchivesCarousel.module.scss';

interface ArchivesCarouselProps {
  /** 역대 대상 수상자 목록 */
  archives: GrandChampion[];
}

export default function ArchivesCarousel({ archives }: ArchivesCarouselProps) {
  const t = useTranslations('HallOfFame');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 핸들러
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 280; // 카드 너비 + gap
    const currentScroll = scrollRef.current.scrollLeft;
    const newScroll =
      direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className={styles.container}>
      {/* 섹션 헤더 */}
      <header className={styles.header}>
        <h3 className={styles.title}>{t('archives')}</h3>

        {/* 스크롤 버튼 */}
        <div className={styles.controls}>
          <button
            className={styles.scrollButton}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className={styles.scrollButton}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* 캐러셀 */}
      <div className={styles.carouselWrapper}>
        <div className={styles.carousel} ref={scrollRef}>
          {archives.map((champion, index) => (
            <motion.article
              key={champion.year}
              className={styles.card}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              {/* 연도 배지 */}
              <div className={styles.yearBadge}>
                <Trophy size={14} />
                <span>{champion.year}</span>
              </div>

              {/* 소속사 로고 */}
              <div className={styles.logo} style={{ background: champion.companyLogo }}>
                <span>{champion.companyName.charAt(0)}</span>
              </div>

              {/* 소속사 이름 */}
              <h4 className={styles.companyName}>{champion.companyName}</h4>

              {/* 통계 */}
              <div className={styles.stats}>
                <span className={styles.winCount}>
                  {champion.winCount} {t('victories')}
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* 데이터 없음 */}
      {archives.length === 0 && (
        <div className={styles.empty}>
          <p>{t('no_champion_yet')}</p>
        </div>
      )}
    </section>
  );
}
