'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { ChevronDown, ChevronRight, ChevronUp, Flame, LockKeyhole, X, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLeagueData } from '@/hooks/useLeagueData';
import { useVoteQuota } from '@/hooks/useVoteQuota';
import {
  getKpopfaceEmbedVoteStatus,
  KPOPFACE_EMBED_POWER_MAX,
  submitVote,
  type KpopfaceEmbedVoteStatus,
} from '@/lib/api';
import { getCompanyLogoBackground, getCompanyLogoUrl } from '@/lib/company-logos';
import type { CompanyRanking } from '@/types/league';
import styles from './EmbedVoteClient.module.scss';

const EMBED_PARENT_ORIGINS = new Set([
  'https://moony01.com',
  'https://www.moony01.com',
  'http://localhost:4000',
  'http://127.0.0.1:4000',
]);

const HOLD_MS_PER_VOTE = 70;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 45;

type Copy = {
  title: string;
  remaining: string;
  completed: string;
  voteUnit: string;
  holdHint: string;
  holding: string;
  expand: string;
  collapse: string;
  loginTitle: string;
  loginBody: string;
  login: string;
  close: string;
  voted: string;
  embedComplete: string;
  loading: string;
  powerVoteLink: string;
  powerCtaTitle: string;
  powerCtaBody: string;
  powerCtaButton: string;
};

const COPY: Record<string, Copy> = {
  ko: {
    title: '내 진짜 원픽에 투표하기', remaining: 'KCL 공유 잔여표', completed: '완료', voteUnit: '표', holdHint: '길게 누르기', holding: '놓으면 투표됩니다', expand: '10위까지 보기', collapse: '접기', loginTitle: '오늘 투표를 모두 사용했어요', loginBody: 'KCL에 가입하면 매일 300표를 사용할 수 있어요.', login: 'KCL 로그인·회원가입', close: '닫기', voted: '{count}표 투표 완료', embedComplete: '오늘의 Kpopface 투표를 완료했어요.', loading: '불러오는 중', powerVoteLink: '100표 더 투표하기', powerCtaTitle: '30표 투표 완료!', powerCtaBody: 'KCL에서 최대 100표 파워투표를 이어가세요.', powerCtaButton: 'KCL에서 100표 파워투표하기',
  },
  en: {
    title: 'Vote for your real pick', remaining: 'KCL votes left', completed: 'Done', voteUnit: 'votes', holdHint: 'Hold to vote', holding: 'Release to vote', expand: 'Show top 10', collapse: 'Collapse', loginTitle: "You've used all votes for today", loginBody: 'Join KCL to use 300 votes every day.', login: 'Log in or sign up for KCL', close: 'Close', voted: '{count} votes cast', embedComplete: "You've completed today's Kpopface vote.", loading: 'Loading', powerVoteLink: 'Power vote with 100 votes on KCL', powerCtaTitle: '30 votes cast!', powerCtaBody: 'Keep the momentum going with up to 100 votes on KCL.', powerCtaButton: 'Power vote with 100 votes on KCL',
  },
  ja: {
    title: '本当の推しに投票しよう', remaining: 'KCL残り投票数', completed: '完了', voteUnit: '票', holdHint: '長押しで投票', holding: '離すと投票されます', expand: '10位まで見る', collapse: '閉じる', loginTitle: '今日の投票を使い切りました', loginBody: 'KCLに登録すると毎日300票を使えます。', login: 'KCLにログイン・登録', close: '閉じる', voted: '{count}票を投票しました', embedComplete: '今日のKpopface投票は完了しました。', loading: '読み込み中', powerVoteLink: 'KCLで100票パワー投票する', powerCtaTitle: '30票投票完了！', powerCtaBody: 'KCLで最大100票のパワー投票を続けましょう。', powerCtaButton: 'KCLで100票パワー投票する',
  },
  zh: {
    title: '为你真正的第一选择投票', remaining: 'KCL 剩余票数', completed: '完成', voteUnit: '票', holdHint: '长按投票', holding: '松开即可投票', expand: '查看前10名', collapse: '收起', loginTitle: '今天的票数已用完', loginBody: '注册KCL后每天可使用300票。', login: '登录或注册KCL', close: '关闭', voted: '已投 {count} 票', embedComplete: '今天的 Kpopface 投票已完成。', loading: '加载中', powerVoteLink: '前往 KCL 进行100票火力投票', powerCtaTitle: '已完成30票投票！', powerCtaBody: '前往 KCL 继续进行最多100票火力投票。', powerCtaButton: '前往 KCL 进行100票火力投票',
  },
  es: {
    title: 'Vota por tu favorito de verdad', remaining: 'Votos KCL restantes', completed: 'Listo', voteUnit: 'votos', holdHint: 'Mantén para votar', holding: 'Suelta para votar', expand: 'Ver top 10', collapse: 'Cerrar', loginTitle: 'Has usado todos tus votos de hoy', loginBody: 'Regístrate en KCL para usar 300 votos al día.', login: 'Iniciar sesión o registrarse en KCL', close: 'Cerrar', voted: '{count} votos emitidos', embedComplete: 'Has completado tu voto de Kpopface de hoy.', loading: 'Cargando', powerVoteLink: 'Vota con 100 votos de poder en KCL', powerCtaTitle: '¡30 votos emitidos!', powerCtaBody: 'Sigue apoyando con hasta 100 votos en KCL.', powerCtaButton: 'Vota con 100 votos de poder en KCL',
  },
  fr: {
    title: 'Vote pour ton vrai favori', remaining: 'Votes KCL restants', completed: 'Fait', voteUnit: 'votes', holdHint: 'Maintiens pour voter', holding: 'Relâche pour voter', expand: 'Voir le top 10', collapse: 'Réduire', loginTitle: 'Tu as utilisé tous tes votes du jour', loginBody: 'Inscris-toi sur KCL pour utiliser 300 votes par jour.', login: 'Se connecter ou s’inscrire sur KCL', close: 'Fermer', voted: '{count} votes comptabilisés', embedComplete: 'Tu as terminé ton vote Kpopface du jour.', loading: 'Chargement', powerVoteLink: 'Voter avec 100 votes puissants sur KCL', powerCtaTitle: '30 votes comptabilisés !', powerCtaBody: 'Continue avec jusqu’à 100 votes sur KCL.', powerCtaButton: 'Voter avec 100 votes puissants sur KCL',
  },
  de: {
    title: 'Stimme für deinen echten Favoriten ab', remaining: 'Verbleibende KCL-Stimmen', completed: 'Fertig', voteUnit: 'Stimmen', holdHint: 'Gedrückt halten', holding: 'Zum Abstimmen loslassen', expand: 'Top 10 anzeigen', collapse: 'Einklappen', loginTitle: 'Du hast alle Stimmen für heute genutzt', loginBody: 'Registriere dich bei KCL und nutze täglich 300 Stimmen.', login: 'Bei KCL anmelden oder registrieren', close: 'Schließen', voted: '{count} Stimmen gezählt', embedComplete: 'Du hast deine Kpopface-Stimme für heute abgegeben.', loading: 'Wird geladen', powerVoteLink: 'Mit 100 Stimmen auf KCL abstimmen', powerCtaTitle: '30 Stimmen gezählt!', powerCtaBody: 'Stimme auf KCL mit bis zu 100 Stimmen weiter ab.', powerCtaButton: 'Mit 100 Stimmen auf KCL abstimmen',
  },
};

function getCopy(locale: string) { return COPY[locale] || COPY.en; }

function sendToParent(message: Record<string, unknown>) {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ source: 'kcl-kpopface-embed', ...message }, '*');
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

function CompanyRow({
  company, copy, canVote, isSubmitting, displayVoteCount, recentVoteCount, onPowerStart, onPowerFinish, onPowerCancel,
}: {
  company: CompanyRanking;
  copy: Copy;
  canVote: boolean;
  isSubmitting: boolean;
  displayVoteCount: number;
  recentVoteCount?: number;
  onPowerStart: (company: CompanyRanking) => void;
  onPowerFinish: () => void;
  onPowerCancel: () => void;
}) {
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    onPowerStart(company);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key !== 'Enter' && event.key !== ' ') || event.repeat) return;
    event.preventDefault();
    onPowerStart(company);
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPowerFinish();
  };

  const logoUrl = getCompanyLogoUrl(company.companyId, company.logoUrl, company.nameEn);
  const logoBackground = getCompanyLogoBackground(company.companyId, company.nameEn, logoUrl);

  return (
    <li className={styles.row}>
      <span className={styles.rank}>{company.rank}</span>
      <span className={styles.logo} style={{ background: logoBackground }}>
        {logoUrl ? <img src={logoUrl} alt="" /> : company.nameEn.slice(0, 1)}
      </span>
      <span className={styles.companyInfo}>
        <strong>{company.nameEn || company.nameKo}</strong>
        <span className={styles.score}>
          <Flame size={14} aria-hidden="true" />
          <strong className={recentVoteCount ? styles.scoreBump : undefined}>{displayVoteCount.toLocaleString()}</strong>
          <small>{copy.voteUnit}</small>
          {recentVoteCount && <span className={styles.voteBurst} aria-live="polite">+{recentVoteCount}</span>}
        </span>
      </span>
      <button
        className={styles.voteButton}
        type="button"
        onPointerDown={handlePointerDown}
        onPointerUp={onPowerFinish}
        onPointerCancel={onPowerCancel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={onPowerCancel}
        disabled={isSubmitting}
        aria-disabled={!canVote}
        aria-label={`${company.nameEn || company.nameKo} ${copy.holdHint}`}
      >
        <Zap size={14} aria-hidden="true" />
        <span className={styles.voteButtonText}>{copy.holdHint}</span>
      </button>
    </li>
  );
}

export default function EmbedVoteClient({ locale }: { locale: string }) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const { user, isLoading: isAuthLoading } = useAuth();
  const { allCompanies, isLoading: isLeagueLoading, refresh } = useLeagueData({ refreshInterval: 20000 });
  const { quota, useVote: consumeVote, isLoading: isQuotaLoading, refetchStats } = useVoteQuota(user?.id, {
    guestDailyLimit: 30,
    storageKey: 'kcl_kpopface_embed_quota',
  });
  const [embedStatus, setEmbedStatus] = useState<KpopfaceEmbedVoteStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isKclModalSurface, setIsKclModalSurface] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPowerCta, setShowPowerCta] = useState(false);
  const [message, setMessage] = useState('');
  const [activeCompany, setActiveCompany] = useState<CompanyRanking | null>(null);
  const [heldVotes, setHeldVotes] = useState(0);
  const [scoreOverrides, setScoreOverrides] = useState<Record<string, number>>({});
  const [celebratedVote, setCelebratedVote] = useState<{ companyId: string; votePower: number } | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const holdRef = useRef<{ companyId: string; maxVotes: number; votes: number; startedAt: number; frameId: number | null } | null>(null);
  const celebrationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const surfaceFrame = window.requestAnimationFrame(() => {
      const isModal = new URLSearchParams(window.location.search).get('surface') === 'kcl-modal';
      setIsKclModalSurface(isModal);
      if (isModal) setIsExpanded(true);
    });

    return () => window.cancelAnimationFrame(surfaceFrame);
  }, []);

  const refetchEmbedStatus = useCallback(async () => {
    const status = await getKpopfaceEmbedVoteStatus(user?.id);
    if (status) setEmbedStatus(status);
    return status;
  }, [user?.id]);

  useEffect(() => {
    if (isAuthLoading) return;
    void refetchEmbedStatus();
  }, [isAuthLoading, refetchEmbedStatus]);

  const hasUsedEmbed = Boolean(embedStatus?.hasUsedEmbed);
  const remainingVotes = embedStatus?.remaining ?? quota.remaining;
  const maxVotePower = Math.min(
    KPOPFACE_EMBED_POWER_MAX,
    embedStatus?.maxVotePower ?? quota.remaining,
  );
  const canVote = !hasUsedEmbed && (embedStatus?.canVote ?? quota.canVote) && maxVotePower > 0;
  const visibleCompanies = useMemo(() => allCompanies.slice(0, isExpanded ? 10 : 4), [allCompanies, isExpanded]);

  const notifyResize = useCallback(() => {
    const height = containerRef.current?.scrollHeight || document.documentElement.scrollHeight;
    sendToParent({ type: 'resize', height });
  }, []);

  useEffect(() => {
    const observer = containerRef.current ? new ResizeObserver(notifyResize) : null;
    if (containerRef.current && observer) observer.observe(containerRef.current);
    notifyResize();
    return () => observer?.disconnect();
  }, [notifyResize, isExpanded, showLoginPrompt, showPowerCta, isLeagueLoading]);

  const handleLogin = useCallback(() => {
    const returnTo = getParentReturnUrl(locale);
    sendToParent({ type: 'auth_required', returnTo });
    if (window.top) window.top.location.href = `https://kclhq.com/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`;
  }, [locale]);

  const triggerGameEffects = useCallback((companyId: string, votePower: number) => {
    const companyColor = allCompanies.find((company) => company.companyId === companyId)?.gradientColor || '#7c3aed';

    // Keep the iframe feedback consistent with KCL's main voting experience.
    confetti({
      particleCount: 60 + votePower * 20,
      spread: 50 + votePower * 10,
      origin: { y: 0.8 },
      colors: [companyColor, '#ffffff', '#FF5733'],
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30 + votePower * 10);
    }
  }, [allCompanies]);

  const submitPowerVote = useCallback(async (companyId: string, votePower: number) => {
    if (isSubmitting) return;
    if (hasUsedEmbed) {
      setMessage(copy.embedComplete);
      return;
    }
    if (!canVote) {
      setShowLoginPrompt(true);
      sendToParent({ type: 'quota_exhausted', authenticated: Boolean(user) });
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const result = await submitVote({ companyId, userId: user?.id, votePower, voteSource: 'kpopface_embed' });

      if (result.success) {
        const nextRemaining = result.remaining ?? Math.max(remainingVotes - votePower, 0);
        consumeVote(votePower);
        setEmbedStatus((current) => current && ({
          ...current,
          canVote: nextRemaining > 0,
          hasUsedEmbed: nextRemaining <= 0,
          remaining: nextRemaining,
          maxVotePower: nextRemaining,
        }));
        const currentScore = result.currentScore;
        if (typeof currentScore === 'number') {
          setScoreOverrides((current) => ({ ...current, [companyId]: currentScore }));
        }
        triggerGameEffects(companyId, votePower);
        if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
        setCelebratedVote({ companyId, votePower });
        celebrationTimeoutRef.current = setTimeout(() => setCelebratedVote(null), 1200);
        setMessage(copy.voted.replace('{count}', String(votePower)));
        sendToParent({ type: 'vote_success', remaining: nextRemaining });
        if (nextRemaining <= 0) setShowPowerCta(true);

        // Ranking and quota refetches are background work. They must not keep
        // the next 1~30 embed vote locked after a successful submission.
        void Promise.all([refetchStats(), refetchEmbedStatus(), refresh()])
          .then(([, refreshedStatus]) => {
            if (refreshedStatus && !refreshedStatus.canVote) setShowPowerCta(true);
          })
          .catch(() => {
            // The optimistic score and quota state still keep the embed usable.
          });
      } else if (result.errorCode === 'EMBED_DAILY_LIMIT') {
        void refetchEmbedStatus();
        setMessage(copy.embedComplete);
      } else if (result.errorCode === 'RATE_LIMITED' || result.remaining === 0) {
        void Promise.all([refetchStats(), refetchEmbedStatus()]);
        setShowLoginPrompt(true);
        sendToParent({ type: 'quota_exhausted', authenticated: Boolean(user) });
      } else {
        setMessage(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [canVote, consumeVote, copy.embedComplete, copy.voted, hasUsedEmbed, isSubmitting, refetchEmbedStatus, refetchStats, refresh, remainingVotes, triggerGameEffects, user]);

  const cancelPowerVote = useCallback(() => {
    const hold = holdRef.current;
    if (hold?.frameId) cancelAnimationFrame(hold.frameId);
    holdRef.current = null;
    setActiveCompany(null);
    setHeldVotes(0);
  }, []);

  const finishPowerVote = useCallback(() => {
    const hold = holdRef.current;
    if (!hold) return;
    if (hold.frameId) cancelAnimationFrame(hold.frameId);
    holdRef.current = null;
    setActiveCompany(null);
    setHeldVotes(0);
    void submitPowerVote(hold.companyId, hold.votes);
  }, [submitPowerVote]);

  const startPowerVote = useCallback((company: CompanyRanking) => {
    if (holdRef.current || isSubmitting) return;
    if (hasUsedEmbed) {
      setMessage(copy.embedComplete);
      return;
    }
    if (!canVote) {
      setShowLoginPrompt(true);
      return;
    }

    const hold = {
      companyId: company.companyId,
      maxVotes: maxVotePower,
      votes: 1,
      startedAt: performance.now(),
      frameId: null as number | null,
    };
    holdRef.current = hold;
    setActiveCompany(company);
    setHeldVotes(1);

    const advance = (now: number) => {
      if (holdRef.current !== hold) return;
      const nextVotes = Math.min(
        hold.maxVotes,
        Math.max(1, Math.ceil((now - hold.startedAt) / HOLD_MS_PER_VOTE)),
      );
      if (nextVotes !== hold.votes) {
        hold.votes = nextVotes;
        setHeldVotes(nextVotes);
      }
      if (nextVotes < hold.maxVotes) hold.frameId = requestAnimationFrame(advance);
    };
    hold.frameId = requestAnimationFrame(advance);
  }, [canVote, copy.embedComplete, hasUsedEmbed, isSubmitting, maxVotePower]);

  useEffect(() => () => {
    cancelPowerVote();
    if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current);
  }, [cancelPowerVote]);

  if (isLeagueLoading || isAuthLoading || isQuotaLoading) {
    return <div className={styles.loading}>{copy.loading}...</div>;
  }

  const gaugeProgress = activeCompany ? (heldVotes / Math.max(maxVotePower, 1)) * 100 : 0;
  const kclMainUrl = `https://kclhq.com/${locale}`;

  return (
    <main
      ref={containerRef}
      className={styles.embed}
      data-surface={isKclModalSurface ? 'kcl-modal' : undefined}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>KPOP COMPANY LEAGUE</p>
          <h1>{copy.title}</h1>
          {!isKclModalSurface && (
            <div className={styles.powerVoteAction}>
              <a className={styles.powerVoteLink} href={kclMainUrl} target="_top" rel="noopener noreferrer">
                <Zap size={15} aria-hidden="true" />
                <span>{copy.powerVoteLink}</span>
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </div>
          )}
        </div>
      </header>

      <ol className={styles.list}>
        {visibleCompanies.map((company) => (
          <CompanyRow
            key={company.companyId}
            company={company}
            copy={copy}
            canVote={canVote}
            isSubmitting={isSubmitting}
            displayVoteCount={scoreOverrides[company.companyId] ?? company.voteCount}
            recentVoteCount={celebratedVote?.companyId === company.companyId ? celebratedVote.votePower : undefined}
            onPowerStart={startPowerVote}
            onPowerFinish={finishPowerVote}
            onPowerCancel={cancelPowerVote}
          />
        ))}
      </ol>

      {(message || hasUsedEmbed) && (
        <div className={styles.footer}>
          <span role="status" aria-live="polite">{message || copy.embedComplete}</span>
        </div>
      )}

      {!isKclModalSurface && allCompanies.length > 4 && (
        <div className={styles.expandAction}>
          <button className={styles.expandButton} type="button" onClick={() => setIsExpanded((current) => !current)} aria-expanded={isExpanded}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {isExpanded ? copy.collapse : copy.expand}
          </button>
        </div>
      )}

      {activeCompany && (
        <div className={styles.holdOverlay} aria-live="polite" aria-atomic="true">
          <div className={styles.holdGauge}>
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle className={styles.gaugeTrack} cx="50" cy="50" r="45" />
              <circle className={styles.gaugeProgress} cx="50" cy="50" r="45" style={{ strokeDasharray: GAUGE_CIRCUMFERENCE, strokeDashoffset: GAUGE_CIRCUMFERENCE * (1 - gaugeProgress / 100) }} />
            </svg>
            <div className={styles.gaugeValue}><strong>{heldVotes}</strong><span>/ {maxVotePower}</span></div>
            <p>{activeCompany.nameEn || activeCompany.nameKo}</p>
            <small>{copy.holding}</small>
          </div>
        </div>
      )}

      {showPowerCta && !isKclModalSurface && (
        <section className={styles.powerCta} role="dialog" aria-modal="false" aria-labelledby="embed-power-cta-title">
          <button className={styles.closeButton} type="button" onClick={() => setShowPowerCta(false)} aria-label={copy.close}><X size={18} /></button>
          <Zap size={24} aria-hidden="true" />
          <h2 id="embed-power-cta-title">{copy.powerCtaTitle}</h2>
          <p>{copy.powerCtaBody}</p>
          <a className={styles.powerCtaButton} href={kclMainUrl} target="_top" rel="noopener noreferrer">{copy.powerCtaButton}</a>
        </section>
      )}

      {showLoginPrompt && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.loginPrompt} role="dialog" aria-modal="true" aria-labelledby="embed-login-title">
            <button className={styles.closeButton} type="button" onClick={() => setShowLoginPrompt(false)} aria-label={copy.close}><X size={18} /></button>
            <LockKeyhole size={24} aria-hidden="true" />
            <h2 id="embed-login-title">{copy.loginTitle}</h2>
            <p>{copy.loginBody}</p>
            <button className={styles.loginButton} type="button" onClick={handleLogin}>{copy.login}</button>
          </section>
        </div>
      )}
    </main>
  );
}
