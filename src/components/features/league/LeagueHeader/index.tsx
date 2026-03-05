'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRefreshCountdown } from '@/hooks/useRefreshCountdown';
import styles from './LeagueHeader.module.scss';

function getTimeUntilSeasonEnd(): number {
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset + now.getTimezoneOffset() * 60 * 1000);
  const thisMonthSettlement = new Date(kstNow.getFullYear(), kstNow.getMonth(), 1, 9, 0, 0, 0);
  const nextMonthSettlement = new Date(kstNow.getFullYear(), kstNow.getMonth() + 1, 1, 9, 0, 0, 0);
  const target = kstNow < thisMonthSettlement ? thisMonthSettlement : nextMonthSettlement;
  const targetLocal = new Date(target.getTime() - kstOffset - now.getTimezoneOffset() * 60 * 1000);
  return Math.max(0, targetLocal.getTime() - now.getTime());
}

export function LeagueHeader() {
  const locale = useLocale();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [msRemaining, setMsRemaining] = useState<number>(() => getTimeUntilSeasonEnd());

  useEffect(() => {
    const timer = setInterval(() => setMsRemaining(getTimeUntilSeasonEnd()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 데이터 싱크 카운트다운 (20초 주기)
  const { countdown, isRefreshing } = useRefreshCountdown({ intervalMs: 20000 });

  const days = Math.floor(msRemaining / 86400000);
  const hours = Math.floor((msRemaining % 86400000) / 3600000);
  const minutes = Math.floor((msRemaining % 3600000) / 60000);
  const seconds = Math.floor((msRemaining % 60000) / 1000);

  const numericLocales = ['ko', 'ja', 'zh'];
  const monthLabel = numericLocales.includes(locale)
    ? String(month)
    : new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month - 1, 1));

  const seasonLabel = numericLocales.includes(locale)
    ? `${year}년 ${monthLabel}월 시즌`
    : `${monthLabel} ${year} Season`;

  const ddayLabel =
    days === 0
      ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `D-${days}`;

  const isUrgent = days <= 1;

  return (
    <motion.div
      className={styles.infoBar}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* 좌측: 트로피 + h1 */}
      <div className={styles.titleGroup}>
        <motion.span
          animate={{
            rotate: [0, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1.1, 1.05, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
          aria-hidden="true"
          className={styles.trophyWrapper}
        >
          <Trophy className={styles.trophyIcon} size={20} />
        </motion.span>
        <h1 className={styles.title}>
          <span className={styles.brand}>
            <span className={styles.brandShort}>KCL</span>
            <span className={styles.brandFull}>KPOP COMPANY LEAGUE</span>
          </span>
          <span className={styles.seasonInfo}>{seasonLabel}</span>
        </h1>
      </div>

      {/* 우측: 데이터 싱크 + D-day */}
      <div className={styles.rightGroup}>
        {/* 데이터 싱크 카운트다운 */}
        <AnimatePresence mode="wait">
          {isRefreshing ? (
            <motion.div
              key="refreshing"
              className={styles.syncBadge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <Loader2 size={10} />
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="countdown"
              className={styles.syncBadge}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                style={{ display: 'flex' }}
              >
                <RefreshCw size={10} />
              </motion.span>
              <motion.span
                key={countdown}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {countdown}s
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* D-day 배지 */}
        <motion.div
          className={styles.badge}
          data-urgent={isUrgent}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className={styles.ddayLabel}>{ddayLabel}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default LeagueHeader;
