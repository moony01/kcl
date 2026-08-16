'use client';

import { Fragment, type CSSProperties } from 'react';
import Image, { type ImageLoader } from 'next/image';
import type { CompanyRanking } from '@/types/league';
import { getCompanyLogoBackground, getCompanyLogoUrl } from '@/lib/company-logos';
import KpopfaceAdCard from '@/components/features/league/KpopfaceAdCard';
import { HOME_DIRECT_VOTE_UNIT } from '@/lib/home-vote';
import styles from './HomeCompanyList.module.scss';

/** Shared with the embed entrypoint so the board has one vote scale. */
export { HOME_DIRECT_VOTE_UNIT } from '@/lib/home-vote';

/**
 * next.config.mjs uses a custom image loader for the static export pipeline.
 * Home logos are already public assets (or Supabase URLs), so keep their URL
 * unchanged while satisfying next/image's required custom-loader contract.
 */
const homeLogoLoader: ImageLoader = ({ src }) => src;

export type HomeVoteStatus = 'loading' | 'success' | 'error' | 'exhausted';

export interface HomeVoteState {
  status: HomeVoteStatus;
  /** 이번 요청/성공 투표 수. 카드 전체 피드백 폭을 계산하는 데 사용합니다. */
  votes: number;
  /** 서버 응답 또는 클라이언트 추정 잔여 quota */
  remaining: number;
  message?: string;
}

export interface HomeCompanyListProps {
  companies: CompanyRanking[];
  quotaRemaining: number;
  isAuthLoading: boolean;
  isQuotaLoading: boolean;
  isVoteLoading: boolean;
  voteStates: Record<string, HomeVoteState | undefined>;
  onVote: (company: CompanyRanking) => void;
  /** Keep the host-specific ad policy while sharing the board itself. */
  showKpopfaceAd?: boolean;
}

interface HomeCompanyCardProps {
  company: CompanyRanking;
  quotaRemaining: number;
  isAuthLoading: boolean;
  isQuotaLoading: boolean;
  isVoteLoading: boolean;
  voteState?: HomeVoteState;
  onVote: (company: CompanyRanking) => void;
}

function getFeedbackMessage(
  voteState: HomeVoteState | undefined,
): string | null {
  if (!voteState) return null;

  if (voteState.status === 'loading') {
    return voteState.votes.toLocaleString() + '표 투표 중…';
  }

  if (voteState.status === 'success') {
    return (
      '+' +
      voteState.votes.toLocaleString() +
      '표 반영 · 오늘 ' +
      voteState.remaining.toLocaleString() +
      '표 남음'
    );
  }

  if (voteState.status === 'exhausted') {
    return '오늘 투표권을 모두 사용했어요.';
  }

  return voteState.message || '투표에 실패했어요. 다시 눌러 주세요.';
}

function HomeCompanyCard({
  company,
  quotaRemaining,
  isAuthLoading,
  isQuotaLoading,
  isVoteLoading,
  voteState,
  onVote,
}: HomeCompanyCardProps) {
  const logoUrl = getCompanyLogoUrl(company.companyId, company.logoUrl, company.nameEn);
  const logoBackground = getCompanyLogoBackground(
    company.companyId,
    company.nameEn,
    logoUrl,
  );
  const isBusy = voteState?.status === 'loading' || isVoteLoading;
  const isUnavailable = isAuthLoading || isQuotaLoading || quotaRemaining <= 0;
  const isDisabled = isBusy || isUnavailable;
  const gaugeVotes =
    voteState?.status === 'loading' || voteState?.status === 'success'
      ? voteState.votes
      : 0;
  const gaugePercent = Math.min(
    100,
    Math.max(0, (gaugeVotes / HOME_DIRECT_VOTE_UNIT) * 100),
  );
  const status = voteState?.status || (quotaRemaining <= 0 ? 'exhausted' : 'idle');
  const hasVoteFeedback = voteState?.status === 'loading' || voteState?.status === 'success';
  const feedbackMessage = getFeedbackMessage(voteState);
  const accentStyle = { '--company-accent': company.gradientColor } as CSSProperties;

  return (
    <button
      type="button"
      className={styles.card}
      data-company-id={company.companyId}
      data-status={status}
      disabled={isDisabled}
      onClick={() => onVote(company)}
      aria-label={
        company.nameEn +
        ', ' +
        company.rank +
        '위, ' +
        company.voteCount.toLocaleString() +
        '표'
      }
    >
      {hasVoteFeedback && (
        <span
          className={styles.feedbackFill}
          data-testid={'vote-feedback-' + company.companyId}
          style={{ width: gaugePercent + '%' }}
          aria-hidden="true"
        />
      )}
      <span className={styles.accent} style={accentStyle} aria-hidden="true" />

      <span className={styles.rank} aria-label={company.rank + '위'}>
        #{company.rank}
      </span>

      <span className={styles.logo} style={{ background: logoBackground }}>
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            className={styles.logoImage}
            width={48}
            height={48}
            loader={homeLogoLoader}
            unoptimized
          />
        ) : (
          company.nameEn.charAt(0)
        )}
      </span>

      <span className={styles.content}>
        <span className={styles.identity}>
          <span className={styles.companyName}>{company.nameKo || company.nameEn}</span>
          {company.nameKo && company.nameKo !== company.nameEn && (
            <span className={styles.companyNameEn}>{company.nameEn}</span>
          )}
        </span>

        <span className={styles.voteCount}>
          {company.voteCount.toLocaleString()}표
        </span>
        {feedbackMessage && (
          <span
            className={styles.feedbackLabel}
            data-testid={'vote-status-' + company.companyId}
            aria-live="polite"
          >
            {feedbackMessage}
          </span>
        )}
      </span>
    </button>
  );
}

export default function HomeCompanyList({
  companies,
  quotaRemaining,
  isAuthLoading,
  isQuotaLoading,
  isVoteLoading,
  voteStates,
  onVote,
  showKpopfaceAd = true,
}: HomeCompanyListProps) {
  return (
    <section className={styles.list} data-testid="home-company-list" aria-label="회사 투표 목록">
      <div className={styles.cards}>
        {companies.map((company) => (
          <Fragment key={company.companyId}>
            {showKpopfaceAd && company.rank === 4 && (
              <div className={styles.adSlot} data-testid="home-kpopface-ad-slot">
                <KpopfaceAdCard />
              </div>
            )}
            <HomeCompanyCard
              company={company}
              quotaRemaining={quotaRemaining}
              isAuthLoading={isAuthLoading}
              isQuotaLoading={isQuotaLoading}
              isVoteLoading={isVoteLoading}
              voteState={voteStates[company.companyId]}
              onVote={onVote}
            />
          </Fragment>
        ))}
      </div>
    </section>
  );
}
