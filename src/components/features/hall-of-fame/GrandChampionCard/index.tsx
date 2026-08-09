/**
 * GrandChampionCard 컴포넌트
 *
 * 연간 챔피언의 핵심 기록만 표시합니다.
 */

/* eslint-disable @next/next/no-img-element -- DB 로고 URL은 외부 호스트와 크기가 고정되지 않습니다. */

'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { GrandChampion } from '@/types/hall-of-fame';
import { getCompanyLogoBackground, getCompanyLogoUrl } from '@/lib/company-logos';
import styles from './GrandChampionCard.module.scss';

interface GrandChampionCardProps {
  /** 대상 수상자 데이터 */
  champion: GrandChampion;
}

export default function GrandChampionCard({ champion }: GrandChampionCardProps) {
  const t = useTranslations('HallOfFame');
  const locale = useLocale();
  const logoUrl = getCompanyLogoUrl(champion.companyId, champion.companyLogoUrl, champion.companyName);
  const logoBackground = getCompanyLogoBackground(champion.companyId, champion.companyName, logoUrl);

  const formattedVotes = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(champion.totalVotesInYear);

  return (
    <section className={styles.container} aria-labelledby="annual-champion-title">
      <h2 id="annual-champion-title" className={styles.title}>
        {champion.year} {t('annual_champion')}
      </h2>

      <div className={styles.record}>
        <div className={styles.identity}>
          <div className={styles.logoWrapper} style={{ background: logoBackground }}>
            {logoUrl ? (
              <img src={logoUrl} alt={champion.companyName} className={styles.logoImage} />
            ) : (
              <span className={styles.logoText}>{champion.companyName.charAt(0)}</span>
            )}
          </div>
          <strong className={styles.companyName}>{champion.companyName}</strong>
        </div>

        <dl className={styles.stats}>
          <div className={styles.statItem}>
            <dd>{champion.winCount}</dd>
            <dt>{t('victories')}</dt>
          </div>
          <div className={styles.statItem}>
            <dd>{formattedVotes}</dd>
            <dt>{t('total_votes')}</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
