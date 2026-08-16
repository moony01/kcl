/**
 * KCL 홈 클라이언트 표면
 *
 * 홈은 회사 카드 목록과 직접투표만 담당합니다. 검색/선택/BottomSheet/
 * StickyPanel은 공통 임베드 표면에서 계속 사용하므로 이 경로에서는 렌더링하지 않습니다.
 */

'use client';

import type { CompaniesResponse } from '@/types/api';
import { useLeagueData } from '@/hooks/useLeagueData';
import useHomeDirectVoting from '@/hooks/useHomeDirectVoting';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import HomeBoardHeader from '@/components/features/home/HomeBoardHeader';
import HomeCompanyList from '@/components/features/home/HomeCompanyList';
import styles from './page.module.scss';

export {
  formatHomeDdayLabel,
  formatHomeSeasonLabel,
} from '@/components/features/home/HomeBoardHeader';
export { HOME_DIRECT_VOTE_UNIT, getDirectVoteAmount as getHomeDirectVoteAmount } from '@/lib/home-vote';

interface HomeClientProps {
  /** 서버에서 미리 fetch한 초기 데이터 (옵셔널, SSG에서는 사용 안 함) */
  initialData?: CompaniesResponse | null;
}

/**
 * 홈페이지 클라이언트
 *
 * @param initialData - 서버에서 미리 fetch한 리그 데이터 (옵셔널)
 */
export function HomeClient({ initialData }: HomeClientProps = {}) {
  const {
    allCompanies,
    season,
    isLoading,
    error,
    refresh,
  } = useLeagueData({
    refreshInterval: 20000,
    fallbackData: initialData ?? undefined,
  });
  const { countdown, isRefreshing } = useRefreshCountdown({
    intervalMs: 20000,
    refreshingDurationMs: 1500,
  });
  const {
    quota,
    isAuthLoading,
    isQuotaLoading,
    isVoteLoading,
    voteStates,
    onVote,
  } = useHomeDirectVoting({
    refresh,
    policy: { voteSource: 'web', effects: true },
  });

  if (isLoading && allCompanies.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading company votes...</p>
      </div>
    );
  }

  if (error && allCompanies.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load company votes</p>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <HomeBoardHeader
        season={season}
        quotaRemaining={quota.remaining}
        countdown={countdown}
        isRefreshing={isRefreshing}
      />

      <HomeCompanyList
        companies={allCompanies}
        quotaRemaining={quota.remaining}
        isAuthLoading={isAuthLoading}
        isQuotaLoading={isQuotaLoading}
        isVoteLoading={isVoteLoading}
        voteStates={voteStates}
        onVote={onVote}
      />
    </div>
  );
}

export default HomeClient;
