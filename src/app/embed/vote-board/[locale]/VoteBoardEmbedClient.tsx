'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLeagueData } from '@/hooks/useLeagueData';
import useHomeDirectVoting from '@/hooks/useHomeDirectVoting';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import {
  KPOPFACE_EMBED_VOTE_POLICY,
} from '@/components/features/VoteController/votePolicy';
import HomeBoardHeader from '@/components/features/home/HomeBoardHeader';
import VoteBoard from '@/components/features/vote/VoteBoard';
import styles from '@/app/[locale]/page.module.scss';
import embedStyles from './VoteBoardEmbedClient.module.scss';

export type VoteBoardSurface = 'kcl-modal' | 'kpopface' | 'partner';

export interface VoteBoardEmbedOptions {
  surface: VoteBoardSurface;
  showAds: boolean;
}

const EMBED_MESSAGE_SOURCE = 'kcl-kpopface-embed';
const EMBED_PARENT_ORIGINS = new Set([
  'https://moony01.com',
  'https://www.moony01.com',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
]);

const KPOPFACE_SIGNUP_COPY: Record<string, string> = {
  ko: 'KCL 가입하고 매일 300표 받기',
  en: 'Join KCL for 300 votes every day',
  ja: 'KCLに登録して毎日300票を使う',
  zh: '注册 KCL，每天获得 300 票',
  es: 'Regístrate en KCL y consigue 300 votos diarios',
  fr: 'Inscris-toi sur KCL pour 300 votes par jour',
  de: 'Bei KCL registrieren und täglich 300 Stimmen erhalten',
};

const ALLOWED_SURFACES = new Set<VoteBoardSurface>(['kcl-modal', 'kpopface', 'partner']);

/**
 * Parse the small, intentionally allow-listed embed contract.
 * `ads=on` only enables the first-party Kpopface slot; it never accepts HTML
 * or URLs.
 */
export function parseVoteBoardEmbedOptions(search: string): VoteBoardEmbedOptions {
  const params = new URLSearchParams(search);
  const requestedSurface = params.get('surface') as VoteBoardSurface | null;

  return {
    surface:
      requestedSurface && ALLOWED_SURFACES.has(requestedSurface) ? requestedSurface : 'partner',
    showAds: params.get('ads') === 'on',
  };
}

function getParentReturnUrl(locale: string): string {
  if (typeof document === 'undefined') return `https://kclhq.com/${locale}`;

  try {
    const referrer = document.referrer ? new URL(document.referrer) : null;
    if (referrer && EMBED_PARENT_ORIGINS.has(referrer.origin)) {
      const suffix = locale === 'ko' ? '' : `${locale}/`;
      return `${referrer.origin}/kpopface/${suffix}`;
    }
  } catch {
    // Invalid referrer falls back to the KCL page.
  }

  return `https://kclhq.com/${locale}`;
}

function postEmbedMessage(message: Record<string, unknown>) {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ source: EMBED_MESSAGE_SOURCE, ...message }, '*');
}

export default function VoteBoardEmbedClient({
  locale,
  surfaceOverride,
}: {
  locale: string;
  /** Compatibility routes can supply a safe default without rewriting the URL. */
  surfaceOverride?: VoteBoardSurface;
}) {
  const {
    allCompanies,
    season,
    isLoading,
    error,
    refresh,
  } = useLeagueData({ refreshInterval: 20000 });
  const [options, setOptions] = useState<VoteBoardEmbedOptions>({
    surface: 'partner',
    showAds: false,
  });
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { countdown, isRefreshing } = useRefreshCountdown({
    intervalMs: 20000,
    refreshingDurationMs: 1500,
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const parsed = parseVoteBoardEmbedOptions(window.location.search);
      const hasExplicitSurface = new URLSearchParams(window.location.search).has('surface');
      setOptions({
        ...parsed,
        surface: surfaceOverride && !hasExplicitSurface ? surfaceOverride : parsed.surface,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [surfaceOverride]);

  const handleKpopfaceQuotaExhausted = useCallback(() => {
    if (options.surface === 'kpopface') {
      setShowLoginPrompt(true);
      postEmbedMessage({ type: 'quota_exhausted' });
    }
  }, [options.surface]);

  const handleVoteSuccess = useCallback(() => {
    postEmbedMessage({ type: 'vote_success' });
  }, []);

  const isKpopfaceSurface = options.surface === 'kpopface';
  const {
    quota,
    isAuthLoading,
    isQuotaLoading,
    isVoteLoading,
    voteStates,
    onVote,
  } = useHomeDirectVoting({
    refresh,
    policy: isKpopfaceSurface
      ? {
          voteSource: KPOPFACE_EMBED_VOTE_POLICY.voteSource,
          guestDailyLimit: KPOPFACE_EMBED_VOTE_POLICY.guestDailyLimit,
          storageKey: KPOPFACE_EMBED_VOTE_POLICY.storageKey,
          maxVotePower: KPOPFACE_EMBED_VOTE_POLICY.maxPowerLevel,
          readStatus: KPOPFACE_EMBED_VOTE_POLICY.readStatus,
          effects: false,
          onVoteSuccess: handleVoteSuccess,
          onQuotaExhausted: handleKpopfaceQuotaExhausted,
        }
      : {
          voteSource: 'web',
          effects: false,
          onVoteSuccess: handleVoteSuccess,
        },
  });

  // Keep partner iframes sized to the shared board. The host-side contract is
  // intentionally the same as the legacy Kpopface embed, so existing hosts do
  // not need to change their resize listener.
  const notifyResize = useCallback(() => {
    if (typeof window === 'undefined' || window.parent === window) return;

    const height = Math.ceil(
      containerRef.current?.getBoundingClientRect().height
      || document.documentElement.scrollHeight,
    );

    postEmbedMessage({ type: 'resize', height });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const observer = container && typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(notifyResize)
      : null;

    if (container && observer) observer.observe(container);
    const frame = window.requestAnimationFrame(notifyResize);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [
    allCompanies.length,
    isRefreshing,
    notifyResize,
    options.showAds,
    options.surface,
    showLoginPrompt,
  ]);

  const handleKpopfaceLogin = useCallback(() => {
    const returnTo = getParentReturnUrl(locale);
    postEmbedMessage({ type: 'auth_required', returnTo });
    window.top?.location.assign(
      `https://kclhq.com/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`,
    );
  }, [locale]);

  const signupLocale = KPOPFACE_SIGNUP_COPY[locale] ? locale : 'en';
  const signupCopy = KPOPFACE_SIGNUP_COPY[signupLocale];

  if (isLoading && allCompanies.length === 0) {
    return (
      <main className={styles.loadingContainer} data-testid="vote-board-embed-loading">
        <div className={styles.spinner} />
        <p>Loading league data...</p>
      </main>
    );
  }

  if (error && allCompanies.length === 0) {
    return (
      <main className={styles.errorContainer} data-testid="vote-board-embed-error">
        <p>Failed to load data</p>
        <button type="button" onClick={() => void refresh()}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <div ref={containerRef}>
      <main
        className={styles.dashboardContainer}
        data-surface={options.surface}
        data-ads={options.showAds ? 'on' : 'off'}
        data-testid="vote-board-embed"
      >
        <HomeBoardHeader
          season={season}
          quotaRemaining={quota.remaining}
          countdown={countdown}
          isRefreshing={isRefreshing}
        />

        <VoteBoard
          companies={allCompanies}
          quotaRemaining={quota.remaining}
          isAuthLoading={isAuthLoading}
          isQuotaLoading={isQuotaLoading}
          isVoteLoading={isVoteLoading}
          voteStates={voteStates}
          onVote={onVote}
          showKpopfaceAd={options.showAds}
        />
      </main>

      {isKpopfaceSurface && (
        <div className={embedStyles.signupCtaContainer}>
          <a
            className={embedStyles.signupCta}
            href={`/${signupLocale}/signup`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {signupCopy}
          </a>
        </div>
      )}

      {isKpopfaceSurface && showLoginPrompt && (
        <section className={embedStyles.authPrompt} role="dialog" aria-modal="true">
          <p>{KPOPFACE_SIGNUP_COPY[signupLocale]}</p>
          <button type="button" onClick={handleKpopfaceLogin}>
            {signupLocale === 'ko' ? 'KCL 로그인·회원가입' : 'Log in or sign up for KCL'}
          </button>
          <button type="button" onClick={() => setShowLoginPrompt(false)}>
            {signupLocale === 'ko' ? '닫기' : 'Close'}
          </button>
        </section>
      )}
    </div>
  );
}
