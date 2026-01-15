/**
 * RankingPage
 *
 * 랭킹 페이지 컴포넌트
 * 리그별 회사 순위를 탭 형태로 표시합니다.
 *
 * 기능:
 * - 1st League / 2nd League 탭 전환
 * - 회사 순위 목록 표시
 * - 서포트 모달 (투표)
 *
 * @updated T1.10 - Mock → Supabase API 연동
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Bell, RefreshCw } from 'lucide-react';
import RankingItem from '@/components/features/ranking/RankingItem';
import type { CompanyType } from '@/lib/mock-data';
import Tabs from '@/components/common/Tabs';
import SupportModal from '@/components/features/vote/SupportModal';
import { useLeagueData } from '@/hooks/useLeagueData';
import styles from './page.module.scss';

export default function RankingPage() {
  const t = useTranslations('Home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyType | null>(null);

  // 🔥 Supabase API에서 데이터 가져오기
  const { allCompanies, isLoading, error, refresh } = useLeagueData({
    refreshInterval: 30000,
  });

  // CompanyRanking → CompanyType 변환
  const transformedCompanies = useMemo((): CompanyType[] => {
    return allCompanies.map((c) => ({
      id: c.companyId,
      name: { en: c.nameEn, ko: c.nameKo },
      representative: c.artists,
      firepower: c.voteCount,
      rank: c.rank,
      change: c.rankChange > 0 ? 'up' : c.rankChange < 0 ? 'down' : 'same',
      image: c.gradientColor.startsWith('linear-gradient')
        ? c.gradientColor
        : `linear-gradient(135deg, ${c.gradientColor} 0%, #1A1A1A 100%)`,
      stockHistory: [],
    }));
  }, [allCompanies]);

  // 리그별 회사 분류 (1~10위: 1리그, 11위~: 2리그)
  const league1 = transformedCompanies.slice(0, 10);
  const league2 = transformedCompanies.slice(10);

  // 애니메이션 설정
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  /**
   * 랭킹 리스트 컴포넌트
   * @param items - 표시할 회사 목록
   */
  const RankingList = ({ items }: { items: CompanyType[] }) => (
    <motion.ul className={styles.rankingList} variants={container} initial="hidden" animate="show">
      {items.map((company) => (
        <RankingItem
          key={company.id}
          item={company}
          index={company.rank - 1}
          onSupport={() => {
            setSelectedCompany(company);
            setIsModalOpen(true);
          }}
        />
      ))}
    </motion.ul>
  );

  // 로딩 상태
  if (isLoading && allCompanies.length === 0) {
    return (
      <div className={styles.rankingContainer}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('ranking')}</h1>
        </header>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading rankings...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.rankingContainer}>
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{t('ranking')}</h1>
        </header>
        <div className={styles.errorState}>
          <p>Failed to load rankings</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      </div>
    );
  }

  // 탭 아이템 정의
  const tabItems = [
    {
      id: 'league-1',
      label: '1st League',
      content: <RankingList items={league1} />,
    },
    {
      id: 'league-2',
      label: '2nd League',
      content: <RankingList items={league2} />,
    },
  ];

  return (
    <div className={styles.rankingContainer}>
      {/* 페이지 헤더 */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('ranking')}</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={() => refresh()}
            aria-label="Refresh rankings"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
          </button>
          <button className={styles.notificationButton} aria-label="Notifications">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* 리그 탭 */}
      <Tabs items={tabItems} defaultTab="league-1" />

      {/* 서포트 모달 */}
      {selectedCompany && (
        <SupportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          companyName={selectedCompany.name['en']}
          companyId={selectedCompany.id}
          companyImage={selectedCompany.image}
        />
      )}
    </div>
  );
}
