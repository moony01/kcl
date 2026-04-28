/**
 * 뉴스 목록 페이지 OG 이미지 동적 생성
 * Next.js ImageResponse를 사용하여 언어별 OG 이미지 생성
 */
import { ImageResponse } from 'next/og';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/constants';

/** OG 이미지 크기 설정 (권장 사이즈) */
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

/** 언어별 타이틀 */
const titles: Record<SupportedLocale, string> = {
  ko: 'KCL 뉴스 & 인사이트',
  en: 'KCL News & Insights',
  ja: 'KCL ニュース & インサイト',
  zh: 'KCL 新闻与洞察',
  es: 'KCL Noticias e Insights',
  fr: 'KCL Actualités et Analyses',
  de: 'KCL Nachrichten & Insights',
};

/** 언어별 부제목 */
const subtitles: Record<SupportedLocale, string> = {
  ko: 'K-Pop 산업 트렌드와 분석',
  en: 'K-Pop Industry Trends & Analysis',
  ja: 'K-Pop業界トレンドと分析',
  zh: 'K-Pop行业趋势与分析',
  es: 'Tendencias y Análisis de la Industria K-Pop',
  fr: "Tendances et Analyses de l'Industrie K-Pop",
  de: 'K-Pop Branchentrends & Analysen',
};

/**
 * 정적 export를 위한 모든 locale 경로 생성
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * OG 이미지 생성 함수
 */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = (
    SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'en'
  ) as SupportedLocale;

  const title = titles[safeLocale];
  const subtitle = subtitles[safeLocale];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* 배경 패턴 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />

        {/* 뉴스 아이콘 */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 16,
          }}
        >
          📰
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            marginBottom: 16,
            textShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </div>

        {/* 부제목 */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {subtitle}
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 22,
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500,
          }}
        >
          kclhq.com/news
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
