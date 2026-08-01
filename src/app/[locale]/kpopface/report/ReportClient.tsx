'use client';

/* The upload preview is a local blob URL, so next/image cannot optimize it. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getSupabase } from '@/lib/supabase/client';
import styles from './report.module.scss';

const BUCKET = 'kpopface-report-inputs';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type ReportMode = 'summary' | 'full';

interface AgencyFit {
  agency: string;
  explanation: string;
}

interface ReportJson {
  title: string;
  summary: string;
  insights: string[];
  agency_fit: AgencyFit[];
  strengths: string[];
  styling: {
    hair: string;
    makeup: string;
    concept: string;
  };
  audition_tips: string[];
  disclaimer: string;
}

interface ReportRow {
  id: string;
  mode: ReportMode;
  locale: 'ko' | 'en';
  status: 'processing' | 'completed' | 'failed';
  report_json: ReportJson;
  model: string | null;
  created_at: string;
}

interface CreditRow {
  free_claimed: boolean;
  paid_credits: number;
}

function isReportJson(value: unknown): value is ReportJson {
  if (!value || typeof value !== 'object') return false;
  const report = value as Record<string, unknown>;
  return (
    typeof report.title === 'string' &&
    typeof report.summary === 'string' &&
    Array.isArray(report.insights) &&
    Array.isArray(report.agency_fit) &&
    Array.isArray(report.strengths) &&
    typeof report.styling === 'object' &&
    Array.isArray(report.audition_tips) &&
    typeof report.disclaimer === 'string'
  );
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export default function ReportClient({ locale }: { locale: string }) {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabase(), []);
  const [credits, setCredits] = useState<CreditRow>({ free_claimed: false, paid_credits: 0 });
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busyMode, setBusyMode] = useState<ReportMode | 'checkout' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isKorean = locale === 'ko';
  const copy = isKorean
    ? {
        eyebrow: 'KCL × KPOPFACE',
        title: '사진을 다시 올리고, AI 리포트를 받아보세요',
        intro: 'Kpopface의 무료 결과와 별개로 KCL에서 새 AI 모델이 사진을 다시 분석합니다. 사진은 분석 처리 후 삭제됩니다.',
        authTitle: '먼저 KCL 계정으로 시작하세요',
        authBody: 'Google 또는 Kakao로 가입하면 무료 요약 리포트 1회를 받을 수 있습니다.',
        login: '로그인 / 가입하기',
        uploadTitle: '분석할 사진 선택',
        uploadHint: 'JPG, PNG, WEBP · 최대 10MB',
        choose: '사진 선택하기',
        replace: '사진 바꾸기',
        free: '무료 AI 요약 받기',
        used: '무료 리포트 사용 완료',
        full: '상세 AI 리포트 받기',
        pack: '5회권 구매 · $4.99',
        remaining: (count: number) => `유료 리포트 ${count}회 남음`,
        privacy: '원본 사진은 서버에 보관하지 않습니다. 무료 리포트 후 같은 탭에서 결제하면 현재 선택한 파일로 상세 리포트를 이어서 받을 수 있습니다.',
        freeLabel: '무료 요약',
        fullLabel: '상세 리포트',
        history: '내 리포트',
        empty: '아직 생성된 리포트가 없습니다.',
        loading: '리포트를 생성하고 있습니다…',
        checkoutSuccess: '결제가 완료되면 유료 리포트 5회가 계정에 반영됩니다.',
        disclaimer: 'AI가 사진의 보이는 스타일 요소를 바탕으로 작성한 창작 가이드이며, 공식 오디션 평가나 합격 가능성을 의미하지 않습니다.',
      }
    : {
        eyebrow: 'KCL × KPOPFACE',
        title: 'Upload again and get your AI report',
        intro: 'KCL runs a fresh analysis with a new AI model, separate from Kpopface’s free result. Your photo is deleted after processing.',
        authTitle: 'Start with a KCL account',
        authBody: 'Sign up with Google or Kakao to claim one free summary report.',
        login: 'Log in / Sign up',
        uploadTitle: 'Choose a photo to analyze',
        uploadHint: 'JPG, PNG, WEBP · up to 10MB',
        choose: 'Choose photo',
        replace: 'Change photo',
        free: 'Get free AI summary',
        used: 'Free report used',
        full: 'Get detailed AI report',
        pack: 'Buy 5 reports · $4.99',
        remaining: (count: number) => `${count} paid report${count === 1 ? '' : 's'} left`,
        privacy: 'The original photo is not retained on the server. If you upgrade in this tab, the selected in-memory file can be uploaded again for the detailed report.',
        freeLabel: 'Free summary',
        fullLabel: 'Detailed report',
        history: 'My reports',
        empty: 'No reports yet.',
        loading: 'Generating your report…',
        checkoutSuccess: 'After payment is confirmed, 5 paid reports will be added to your account.',
        disclaimer: 'This is a creative guide based on visible style cues in the photo, not an official audition assessment or success prediction.',
      };

  const returnTo = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${pathname}`;
  }, [pathname]);
  const loginHref = `/${locale}/login?returnTo=${encodeURIComponent(returnTo)}`;
  const signupHref = `/${locale}/signup?returnTo=${encodeURIComponent(returnTo)}`;

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    const [{ data: creditData }, { data: reportData }] = await Promise.all([
      supabase
        .from('kpopface_report_credits')
        .select('free_claimed, paid_credits')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('kpopface_reports')
        .select('id, mode, locale, status, report_json, model, created_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setCredits({
      free_claimed: creditData?.free_claimed === true,
      paid_credits: Number(creditData?.paid_credits || 0),
    });
    setReports(
      (reportData || []).filter(
        (report): report is ReportRow => isReportJson((report as { report_json?: unknown }).report_json),
      ) as ReportRow[],
    );
  }, [supabase, user?.id]);

  useEffect(() => {
    if (isAuthenticated) void loadData();
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setNotice(copy.checkoutSuccess);
      void loadData();
    }
  }, [copy.checkoutSuccess, loadData, searchParams]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    setError(null);
    setNotice(null);

    if (!ALLOWED_MIME_TYPES.has(nextFile.type)) {
      setError(isKorean ? 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.' : 'Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (nextFile.size > MAX_IMAGE_BYTES) {
      setError(isKorean ? '이미지는 10MB 이하만 업로드할 수 있습니다.' : 'Images must be 10MB or smaller.');
      return;
    }
    setFile(nextFile);
  };

  const handleGenerate = async (mode: ReportMode) => {
    if (!user?.id || !file || busyMode) return;
    setBusyMode(mode);
    setError(null);
    setNotice(null);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const inputPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    let uploaded = false;

    try {
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(inputPath, file, {
        contentType: file.type,
        cacheControl: 'no-store',
        upsert: false,
      });
      if (uploadError) throw new Error(uploadError.message);
      uploaded = true;

      const { data, error: invokeError } = await supabase.functions.invoke('kpopface-report', {
        body: { inputPath, mode, locale },
      });
      if (invokeError) {
        const payload = data as { error_code?: string; error?: string } | null;
        throw new Error(payload?.error_code || payload?.error || invokeError.message);
      }
      if (!data?.ok) throw new Error(data?.error_code || 'REPORT_FAILED');

      setNotice(mode === 'summary'
        ? (isKorean ? '무료 요약 리포트가 준비되었습니다.' : 'Your free summary is ready.')
        : (isKorean ? '상세 AI 리포트가 준비되었습니다.' : 'Your detailed report is ready.'));
      await loadData();
    } catch (generationError) {
      const code = generationError instanceof Error ? generationError.message : 'REPORT_FAILED';
      if (code === 'FREE_REPORT_ALREADY_USED') {
        setError(isKorean ? '무료 리포트는 계정당 1회만 받을 수 있습니다.' : 'The free report is limited to one per account.');
      } else if (code === 'NO_PAID_CREDITS') {
        setError(isKorean ? '남은 유료 리포트가 없습니다. 5회권을 구매해 주세요.' : 'You have no paid reports left. Buy a 5-report pack to continue.');
      } else {
        setError(isKorean ? '리포트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' : 'The report could not be generated. Please try again.');
      }
    } finally {
      if (uploaded) {
        // The Edge Function normally removes the object in finally; this is a
        // best-effort cleanup for a client-side network failure.
        await supabase.storage.from(BUCKET).remove([inputPath]);
      }
      setBusyMode(null);
    }
  };

  const handleCheckout = async () => {
    if (!user?.id || busyMode) return;
    setBusyMode('checkout');
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('kpopface-checkout', {
        body: { locale },
      });
      if (invokeError || !data?.url) throw new Error(invokeError?.message || 'CHECKOUT_FAILED');
      window.location.assign(data.url as string);
    } catch {
      setError(isKorean ? '결제 페이지를 열지 못했습니다.' : 'We could not open checkout.');
      setBusyMode(null);
    }
  };

  const renderReport = (report: ReportRow) => {
    const data = report.report_json;
    const isFull = report.mode === 'full';
    return (
      <article className={styles.reportCard} key={report.id}>
        <div className={styles.reportMeta}>
          <span className={report.mode === 'full' ? styles.fullBadge : styles.freeBadge}>
            {report.mode === 'full' ? copy.fullLabel : copy.freeLabel}
          </span>
          <time dateTime={report.created_at}>{formatDate(report.created_at, locale)}</time>
        </div>
        <h3>{data.title}</h3>
        <p className={styles.summary}>{data.summary}</p>

        <section>
          <h4>{isKorean ? '핵심 인사이트' : 'Key insights'}</h4>
          <ul>{data.insights.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        {data.agency_fit.length > 0 && (
          <section>
            <h4>{isKorean ? '스타일 방향과 어울리는 레이블' : 'Style directions and label fit'}</h4>
            <div className={styles.agencyGrid}>
              {data.agency_fit.slice(0, isFull ? data.agency_fit.length : 3).map((item) => (
                <div className={styles.agencyItem} key={`${report.id}-${item.agency}`}>
                  <strong>{item.agency}</strong>
                  <span>{item.explanation}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {isFull && (
          <>
            <section>
              <h4>{isKorean ? '강점' : 'Strengths'}</h4>
              <ul>{data.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <section className={styles.styleGrid}>
              <div><h4>{isKorean ? '헤어' : 'Hair'}</h4><p>{data.styling.hair}</p></div>
              <div><h4>{isKorean ? '메이크업' : 'Makeup'}</h4><p>{data.styling.makeup}</p></div>
              <div><h4>{isKorean ? '콘셉트' : 'Concept'}</h4><p>{data.styling.concept}</p></div>
            </section>
            <section>
              <h4>{isKorean ? '오디션 사진 팁' : 'Audition photo tips'}</h4>
              <ul>{data.audition_tips.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </>
        )}

        <p className={styles.disclaimer}>{data.disclaimer || copy.disclaimer}</p>
      </article>
    );
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>
      </section>

      {isAuthLoading ? (
        <div className={styles.panel}><p>{copy.loading}</p></div>
      ) : !isAuthenticated ? (
        <section className={styles.panel}>
          <h2>{copy.authTitle}</h2>
          <p>{copy.authBody}</p>
          <div className={styles.authActions}>
            <Link className={styles.primaryButton} href={loginHref}>{copy.login}</Link>
            <Link className={styles.secondaryButton} href={signupHref}>{isKorean ? '회원가입' : 'Create account'}</Link>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}>
              <div><p className={styles.sectionKicker}>01</p><h2>{copy.uploadTitle}</h2></div>
              <span className={styles.creditPill}>{copy.remaining(credits.paid_credits)}</span>
            </div>

            <input ref={inputRef} className={styles.hiddenInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            <button className={styles.uploadBox} type="button" onClick={() => inputRef.current?.click()}>
              {previewUrl ? <img src={previewUrl} alt={isKorean ? '선택한 사진 미리보기' : 'Selected photo preview'} /> : <span className={styles.uploadIcon}>＋</span>}
              <span>{previewUrl ? copy.replace : copy.choose}</span>
              <small>{copy.uploadHint}</small>
            </button>

            <div className={styles.actions}>
              <button className={styles.primaryButton} type="button" disabled={!file || credits.free_claimed || !!busyMode} onClick={() => void handleGenerate('summary')}>
                {busyMode === 'summary' ? copy.loading : credits.free_claimed ? copy.used : copy.free}
              </button>
              <button className={styles.secondaryButton} type="button" disabled={!file || credits.paid_credits < 1 || !!busyMode} onClick={() => void handleGenerate('full')}>
                {busyMode === 'full' ? copy.loading : copy.full}
              </button>
            </div>

            <div className={styles.purchaseRow}>
              <span>{copy.privacy}</span>
              <button type="button" className={styles.textButton} disabled={busyMode === 'checkout'} onClick={() => void handleCheckout()}>
                {busyMode === 'checkout' ? copy.loading : copy.pack}
              </button>
            </div>
          </section>

          {(error || notice) && <div className={error ? styles.error : styles.notice} role="status">{error || notice}</div>}

          <section className={styles.reportsSection}>
            <div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>02</p><h2>{copy.history}</h2></div></div>
            {reports.length === 0 ? <div className={styles.empty}>{copy.empty}</div> : reports.map(renderReport)}
          </section>
        </>
      )}
    </main>
  );
}
