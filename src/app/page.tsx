/**
 * @file 루트 페이지 (SSG 환경 i18n 리다이렉트)
 * @description
 * SSG 환경에서는 middleware를 사용할 수 없으므로,
 * 클라이언트 사이드에서 브라우저 언어를 감지하여 적절한 locale로 리다이렉트합니다.
 *
 * 지원 언어: ko, en, ja, zh, es, fr, de (7개)
 */

'use client';

import { useEffect } from 'react';

/** 지원하는 로케일 목록 */
const SUPPORTED_LOCALES = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'];

/** 기본 로케일 */
const DEFAULT_LOCALE = 'en';

/**
 * 브라우저 언어를 기반으로 최적의 로케일 반환
 */
function getPreferredLocale(): string {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // navigator.languages (배열) 또는 navigator.language (단일) 사용
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];

  for (const lang of browserLanguages) {
    // 'ko-KR' -> 'ko', 'en-US' -> 'en'
    const shortLang = lang.split('-')[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(shortLang)) {
      return shortLang;
    }
  }

  return DEFAULT_LOCALE;
}

/**
 * 루트 페이지 컴포넌트
 * 브라우저 언어 감지 후 해당 locale 페이지로 리다이렉트
 */
export default function RootPage() {
  useEffect(() => {
    const locale = getPreferredLocale();
    // 현재 경로가 이미 locale을 포함하지 않으면 리다이렉트
    window.location.replace(`/${locale}`);
  }, []);

  // 리다이렉트 중 표시할 로딩 화면
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTopColor: '#f5a623',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>Loading...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
