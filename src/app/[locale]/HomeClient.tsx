/**
 * HomeClient (클라이언트 컴포넌트)
 *
 * KCL 리그 시스템 메인 페이지의 클라이언트 사이드 로직
 * 서버에서 미리 fetch한 데이터(initialData)를 받아 Hydration 수행
 *
 * SSR 구조:
 * - page.tsx (서버 컴포넌트) → 데이터 fetch + SEO용 HTML 생성
 * - HomeClient.tsx (클라이언트) → 인터랙션 + SWR 자동 갱신
 *
 * @updated T1.19 - SSR 적용 (page.tsx에서 분리)
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import type { CompanyType } from '@/lib/mock-data';
import type { LeagueTabType } from '@/types/league';

// 데이터 Hooks
import { useLeagueData } from '@/hooks/useLeagueData';
import type { CompaniesResponse } from '@/types/api';

// UI Components - 지연 로드 (초기 번들 크기 감소)
const BottomSheet = dynamic(() => import('@/components/ui/BottomSheet'), {
  ssr: false, // 모바일 전용, SSR 불필요
});
import StickyPanel from '@/components/ui/StickyPanel';
import SearchBar from '@/components/ui/SearchBar';

// Feature Components - 무거운 컴포넌트 지연 로드
const VoteController = dynamic(() => import('@/components/features/VoteController'), {
  ssr: false,
});
import SeasonHeader from '@/components/features/league/SeasonHeader';
import LeagueTabs from '@/components/features/league/LeagueTabs';
import PremierLeague from '@/components/features/league/PremierLeague';
const Challengers = dynamic(() => import('@/components/features/league/Challengers'), {
  ssr: false,
});

import styles from './page.module.scss';

interface HomeClientProps {
  /** 서버에서 미리 fetch한 초기 데이터 (SSR용) */
  initialData: CompaniesResponse | null;
}

/**
 * 홈페이지 클라이언트 컴포넌트
 *
 * @param initialData - 서버에서 미리 fetch한 리그 데이터
 */
export function HomeClient({ initialData }: HomeClientProps) {
  // 탭 상태 (1부 리그 기본)
  const [activeTab, setActiveTab] = useState<LeagueTabType>('premier');

  // T1.29: 선택된 회사 ID만 상태로 관리 (실제 데이터는 allCompanies에서 파생)
  // 기존 문제: selectedCompany가 투표 시점의 스냅샷을 유지하여 firepower 갱신 안 됨
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // BottomSheet 열림 상태 (모바일)
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Challengers 더 보기 상태
  const [challengersLimit, setChallengersLimit] = useState(10);

  // 화면 크기 감지
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🔥 Supabase API에서 데이터 가져오기 (SSR 초기 데이터 전달)
  // T1.30: polling 주기를 20초로 변경 (Redis 캐시 TTL 25초와 조화)
  const {
    premierLeague,
    challengers: allChallengers,
    allCompanies,
    season,
    promotionBattle,
    leader,
    isLoading,
    error,
    refresh,
  } = useLeagueData({
    refreshInterval: 20000, // T1.30: Redis 캐시 TTL(25초)보다 짧게 설정하여 캐시 hit 극대화
    fallbackData: initialData, // SSR 초기 데이터 전달
  });

  // 2부 리그 페이지네이션
  const challengers = useMemo(() => {
    return allChallengers.slice(0, challengersLimit);
  }, [allChallengers, challengersLimit]);

  // 더 불러올 데이터 있는지
  const hasMoreChallengers = useMemo(() => {
    return challengersLimit < allChallengers.length;
  }, [allChallengers, challengersLimit]);

  // T1.29: 선택된 회사 데이터를 allCompanies에서 파생 (항상 최신 데이터 반영)
  // 기존: selectedCompany state가 투표 시점 스냅샷 유지 → firepower 갱신 안 됨
  // 수정: selectedCompanyId만 state로 관리, 실제 데이터는 useMemo로 파생
  const selectedCompany = useMemo((): CompanyType | null => {
    if (!selectedCompanyId) return null;

    const companyRanking = allCompanies.find((c) => c.companyId === selectedCompanyId);
    if (!companyRanking) return null;

    // CompanyRanking → CompanyType 변환 (최신 firepower 포함)
    return {
      id: companyRanking.companyId,
      name: {
        en: companyRanking.nameEn,
        ko: companyRanking.nameKo,
      },
      representative: companyRanking.artists,
      firepower: companyRanking.voteCount, // ← 이제 항상 최신 값!
      rank: companyRanking.rank,
      change:
        companyRanking.rankChange > 0 ? 'up' : companyRanking.rankChange < 0 ? 'down' : 'same',
      image: companyRanking.gradientColor.startsWith('linear-gradient')
        ? companyRanking.gradientColor
        : `linear-gradient(135deg, ${companyRanking.gradientColor} 0%, #1A1A1A 100%)`,
      stockHistory: [],
    };
  }, [selectedCompanyId, allCompanies]);

  // 투표 핸들러 - 회사 ID만 상태로 설정
  const handleVote = useCallback(
    (companyId: string) => {
      // 회사 존재 확인
      const exists = allCompanies.some((c) => c.companyId === companyId);
      if (!exists) return;

      // T1.29: ID만 설정 (실제 데이터는 useMemo에서 파생)
      setSelectedCompanyId(companyId);

      if (isMobile) {
        setIsSheetOpen(true);
      }
    },
    [allCompanies, isMobile],
  );

  // 투표 성공 핸들러 - 데이터 새로고침
  const handleVoteSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  // 더 보기 핸들러
  const handleLoadMore = useCallback(() => {
    setChallengersLimit((prev) => prev + 10);
  }, []);

  // 검색 결과 선택 핸들러
  const handleSearchSelect = useCallback(
    (companyId: string) => {
      handleVote(companyId);
    },
    [handleVote],
  );

  // 로딩 상태 (initialData가 있으면 로딩 화면 표시 안 함)
  if (isLoading && allCompanies.length === 0 && !initialData) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading league data...</p>
      </div>
    );
  }

  // 에러 상태
  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load data</p>
        <button onClick={() => refresh()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* 상단 영역: 시즌 헤더 + 검색 + 탭 (전체 너비) */}
      <header className={styles.headerSection}>
        {/* 시즌 대시보드 */}
        <SeasonHeader
          season={season}
          leader={leader}
          promotionBattle={promotionBattle}
          onVote={handleVote}
        />

        {/* 검색창 */}
        <div className={styles.searchSection}>
          <SearchBar onSelect={handleSearchSelect} />
        </div>

        {/* 탭 네비게이션 */}
        <LeagueTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          premierCount={premierLeague.length}
          challengersCount={allChallengers.length}
        />
      </header>

      {/* 하단 영역: 탭 콘텐츠 + Battle Station (2열 레이아웃) */}
      <div className={styles.contentLayout}>
        {/* 좌측: 탭 콘텐츠 영역 */}
        <section className={styles.leagueListSection}>
          <AnimatePresence mode="wait">
            {activeTab === 'premier' ? (
              <motion.div
                key="premier"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <PremierLeague companies={premierLeague} onVote={handleVote} />
              </motion.div>
            ) : (
              <motion.div
                key="challengers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Challengers
                  companies={challengers}
                  onVote={handleVote}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMoreChallengers}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 우측: Battle Station 패널 (데스크톱 전용) */}
        <aside className={styles.panelColumn}>
          <StickyPanel isVisible={true} title="Battle Station">
            <VoteController company={selectedCompany} onVoteSuccess={handleVoteSuccess} />
          </StickyPanel>
        </aside>
      </div>

      {/* 모바일 투표 BottomSheet */}
      <BottomSheet
        isOpen={isSheetOpen && isMobile}
        onClose={() => setIsSheetOpen(false)}
        heightRatio={0.55}
      >
        <VoteController company={selectedCompany} onVoteSuccess={handleVoteSuccess} />
      </BottomSheet>
    </div>
  );
}

export default HomeClient;
