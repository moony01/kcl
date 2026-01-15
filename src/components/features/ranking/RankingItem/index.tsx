"use client";

import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronRight } from 'lucide-react';
import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Button from '@/components/common/Button';
import { CompanyType } from '@/lib/mock-data';
import styles from './RankingItem.module.scss';
import { useLocale } from 'next-intl';

interface RankingItemProps {
  item: CompanyType;
  index: number;
  onSupport?: () => void;
}

export default function RankingItem({ item, index, onSupport }: RankingItemProps) {
  const t = useTranslations('Home');
  const locale = useLocale() as 'en' | 'ko';

  const isTop3 = index < 3;
  const RankIcon = item.change === 'up' ? ArrowUp : item.change === 'down' ? ArrowDown : Minus;
  
  const targetRepresentative = item.representative[locale as 'en' | 'ko'] || item.representative['en'];
  const targetName = item.name[locale as 'en' | 'ko'] || item.name['en'];

  const artistList = targetRepresentative.slice(0, 3).join(', ');
  const moreCount = targetRepresentative.length > 3 ? `+${targetRepresentative.length - 3}` : '';

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSupport?.();
  };

  return (
    <motion.li
      className={classNames(styles.item, { [styles.top3]: isTop3 })}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link 
        href={`/${locale}/company/${item.id}`} 
        className={styles.linkWrapper}
        style={{ display: 'flex', width: '100%', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
      >
        <div className={styles.rankInfo}>
          <span className={classNames(styles.rankNum, styles[`rank-${index + 1}`])}>
            {item.rank}
          </span>
          <div className={classNames(styles.change, styles[item.change])}>
            <RankIcon size={12} />
          </div>
        </div>

        <div className={styles.profile}>
          <div 
            className={styles.avatar} 
            style={{ background: item.image }}
          >
            <span className={styles.initial}>{item.name.en.substring(0, 1)}</span>
          </div>
          <div className={styles.info}>
            <h3 className={styles.name}>{targetName}</h3>
            <p className={styles.artists}>
               <span className={styles.keyLabel}>Key:</span> {artistList} {moreCount}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.firepower}>
            <span className={styles.label}>Firepower</span>
            <span className={styles.score}>{item.firepower.toLocaleString()}</span>
          </div>
          <Button 
            size="sm" 
            className={styles.supportBtn}
            onClick={handleSupportClick}
            style={{ 
              borderRadius: '50%', width: '36px', height: '36px', padding: 0, 
              background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <Zap size={18} fill="currentColor" className={styles.zapIcon} />
          </Button>
        </div>
      </Link>
    </motion.li>
  );
}

import { Zap } from 'lucide-react';
