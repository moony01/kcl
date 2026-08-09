/**
 * ChampionBadge 컴포넌트
 *
 * 월간 챔피언 한 건을 기록 행으로 표시합니다.
 */

/* eslint-disable @next/next/no-img-element -- DB 로고 URL은 외부 호스트와 크기가 고정되지 않습니다. */

'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { MonthlyChampion } from '@/types/hall-of-fame';
import { getCompanyLogoBackground, getCompanyLogoUrl } from '@/lib/company-logos';
import styles from './ChampionBadge.module.scss';

interface ChampionBadgeProps {
  /** 월간 챔피언 데이터 */
  champion: MonthlyChampion;
}

export default function ChampionBadge({ champion }: ChampionBadgeProps) {
  const t = useTranslations('HallOfFame');
  const locale = useLocale();
  const logoUrl = getCompanyLogoUrl(champion.companyId, champion.companyLogoUrl, champion.companyName);
  const logoBackground = getCompanyLogoBackground(champion.companyId, champion.companyName, logoUrl);
  const formattedVotes = new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(champion.totalVotes);

  // 월 이름 가져오기
  const monthKey = champion.month.toString() as
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12';

  return (
    <div className={styles.badge}>
      <span className={styles.monthLabel}>{t(`months.${monthKey}`)}</span>

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

      <div className={styles.voteRecord}>
        <strong>{formattedVotes}</strong>
        <span>{t('votes')}</span>
      </div>
    </div>
  );
}
