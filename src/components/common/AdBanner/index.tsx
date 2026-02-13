'use client';

import { useEffect, useRef } from 'react';
import { ADSENSE_PUBLISHER_ID } from '@/lib/constants';
import styles from './AdBanner.module.scss';

/** 광고 포맷 타입 */
type AdFormat = 'leaderboard' | 'rectangle' | 'in-article';

interface AdBannerProps {
  /** AdSense 광고 슬롯 ID */
  adSlot: string;
  /** 광고 포맷 (레이아웃별 크기 결정) */
  adFormat?: AdFormat;
}

/**
 * Google AdSense 광고 배너 컴포넌트
 *
 * - useRef로 중복 push 방지 (React StrictMode 대응)
 * - CLS 방지를 위한 포맷별 min-height 설정
 * - 다크/라이트 테마 호환
 */
export default function AdBanner({ adSlot, adFormat = 'leaderboard' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    if (isAdPushed.current) return;

    try {
      const adsbygoogle = (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || [];
      adsbygoogle.push({});
      isAdPushed.current = true;
    } catch {
      // AdSense 스크립트 미로드 또는 광고 차단기 사용 시 무시
    }
  }, []);

  return (
    <div className={`${styles.adBanner} ${styles[adFormat]}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat === 'in-article' ? 'fluid' : 'auto'}
        data-full-width-responsive="true"
        {...(adFormat === 'in-article' && { 'data-ad-layout': 'in-article' })}
      />
    </div>
  );
}
