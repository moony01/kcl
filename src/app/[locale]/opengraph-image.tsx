/**
 * OG 이미지 동적 생성
 * Next.js ImageResponse를 사용하여 언어별 OG 이미지 생성
 * 정적 export 호환 (generateStaticParams 사용)
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
  ko: 'K-POP 기획사 리그',
  en: 'K-Pop Company League',
  ja: 'K-POP企画社リーグ',
  zh: 'K-POP娱乐公司联赛',
  es: 'Liga de Compañías K-Pop',
  fr: 'Ligue des Agences K-Pop',
  de: 'K-Pop Agentur Liga',
};

/** 언어별 부제목 */
const subtitles: Record<SupportedLocale, string> = {
  ko: '팬덤의 화력을 증명하세요!',
  en: "Prove Your Fandom's Firepower!",
  ja: 'ファンダムのパワーを証明しよう!',
  zh: '证明你的粉丝力量!',
  es: '¡Demuestra el poder de tu fandom!',
  fr: 'Prouvez la puissance de votre fandom!',
  de: 'Beweise die Stärke deines Fandoms!',
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c026d3 100%)',
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

        {/* KCL 로고 텍스트 */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: 'white',
            textShadow: '0 4px 12px rgba(0,0,0,0.3)',
            letterSpacing: '-2px',
            marginBottom: 8,
          }}
        >
          KCL
        </div>

        {/* 타이틀 */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            marginBottom: 16,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
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
          }}
        >
          {subtitle}
        </div>

        {/* 트로피 이모지 */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 32,
            fontSize: 48,
          }}
        >
          <span>🏆</span>
          <span>⭐</span>
          <span>🎤</span>
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
          kclhq.com
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
