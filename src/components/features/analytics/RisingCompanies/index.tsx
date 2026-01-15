/**
 * RisingCompanies 컴포넌트
 *
 * 급상승 소속사 Top 5를 리스트로 표시합니다.
 * 상승률과 순위 변동을 시각화합니다.
 */

'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronUp } from 'lucide-react';
import type { RisingCompany } from '@/data/mock-analytics';
import styles from './RisingCompanies.module.scss';

interface RisingCompaniesProps {
  /** 급상승 회사 데이터 배열 */
  data: RisingCompany[];
}

export default function RisingCompanies({ data }: RisingCompaniesProps) {
  const t = useTranslations('Analytics');

  // 숫자 포맷팅
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // 애니메이션 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <TrendingUp size={18} className={styles.icon} />
          <h3 className={styles.title}>{t('charts.rising')}</h3>
        </div>
        <p className={styles.description}>{t('charts.rising_desc')}</p>
      </div>

      <motion.ul
        className={styles.list}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {data.map((company, index) => (
          <motion.li key={company.id} className={styles.item} variants={itemVariants}>
            {/* 순위 뱃지 */}
            <div className={styles.rankBadge}>
              <span className={styles.rank}>{index + 1}</span>
            </div>

            {/* 회사 정보 */}
            <div className={styles.companyInfo}>
              <div className={styles.colorBar} style={{ backgroundColor: company.color }} />
              <div className={styles.nameWrapper}>
                <span className={styles.name}>{company.name}</span>
                <span className={styles.votes}>
                  {formatNumber(company.currentVotes)} {t('votes')}
                </span>
              </div>
            </div>

            {/* 상승 지표 */}
            <div className={styles.growth}>
              <div className={styles.percentBadge}>
                <ChevronUp size={14} />
                <span>{company.changePercent}%</span>
              </div>
              {company.previousRank > company.rank && (
                <span className={styles.rankChange}>
                  +{company.previousRank - company.rank} {t('rank_up')}
                </span>
              )}
            </div>
          </motion.li>
        ))}
      </motion.ul>

      {data.length === 0 && (
        <div className={styles.empty}>
          <p>{t('no_data')}</p>
        </div>
      )}
    </div>
  );
}
