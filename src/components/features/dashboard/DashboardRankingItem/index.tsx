/**
 * DashboardRankingItem
 *
 * 대시보드용 랭킹 아이템 컴포넌트
 * Split Action UI를 적용하여 클릭 영역을 분리합니다.
 *
 * 기능:
 * - 본문 클릭: 투표 패널 오픈
 * - 우측 Chevron 클릭: 상세 페이지 이동
 * - 하이라이트 효과 (검색/투표 시)
 * - 스테거 애니메이션
 */

'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus, ChevronRight, Zap } from 'lucide-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { CompanyType } from '@/lib/mock-data';
import styles from './DashboardRankingItem.module.scss';

interface DashboardRankingItemProps {
  /** 회사 데이터 */
  item: CompanyType;
  /** 리스트 인덱스 (애니메이션용) */
  index: number;
  /** 본문 클릭 핸들러 (투표 패널 오픈) */
  onSelect: (company: CompanyType) => void;
  /** 하이라이트 상태 */
  isHighlighted?: boolean;
  /** 최근 투표된 상태 */
  isVoted?: boolean;
}

const DashboardRankingItem = forwardRef<HTMLLIElement, DashboardRankingItemProps>(
  ({ item, index, onSelect, isHighlighted, isVoted }, ref) => {
    const router = useRouter();
    const locale = useLocale();

    const isTop3 = index < 3;
    const RankIcon = item.change === 'up' ? ArrowUp : item.change === 'down' ? ArrowDown : Minus;

    // 현재 로케일에 맞는 데이터
    const targetName = item.name[locale as 'en' | 'ko'] || item.name['en'];
    const targetRepresentative =
      item.representative[locale as 'en' | 'ko'] || item.representative['en'];

    // 대표 아티스트 표시 (최대 3명)
    const artistList = targetRepresentative.slice(0, 3).join(', ');
    const moreCount = targetRepresentative.length > 3 ? `+${targetRepresentative.length - 3}` : '';

    // 본문 클릭 (투표 패널 오픈)
    const handleBodyClick = () => {
      onSelect(item);
    };

    // 상세 페이지 이동
    const handleDetailClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/${locale}/company/${item.id}`);
    };

    return (
      <motion.li
        ref={ref}
        className={classNames(styles.item, {
          [styles.top3]: isTop3,
          [styles.highlighted]: isHighlighted,
          [styles.voted]: isVoted,
        })}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.04 }}
        layout
      >
        {/* 메인 클릭 영역 (투표) */}
        <button
          className={styles.mainArea}
          onClick={handleBodyClick}
          aria-label={`Vote for ${targetName}`}
        >
          {/* 랭크 정보 */}
          <div className={styles.rankInfo}>
            <span className={classNames(styles.rankNum, styles[`rank-${index + 1}`])}>
              {item.rank}
            </span>
            <div className={classNames(styles.change, styles[item.change])}>
              <RankIcon size={12} />
            </div>
          </div>

          {/* 프로필 영역 */}
          <div className={styles.profile}>
            <div className={styles.avatar} style={{ background: item.image }}>
              <span className={styles.initial}>{item.name.en.substring(0, 1)}</span>
            </div>
            <div className={styles.info}>
              <h3 className={styles.name}>{targetName}</h3>
              <p className={styles.artists}>
                <span className={styles.keyLabel}>Key:</span> {artistList} {moreCount}
              </p>
            </div>
          </div>

          {/* 화력 점수 */}
          <div className={styles.firepower}>
            <span className={styles.label}>Firepower</span>
            <span className={styles.score}>
              <Zap size={14} fill="currentColor" />
              {item.firepower.toLocaleString()}
            </span>
          </div>
        </button>

        {/* 상세 이동 버튼 (분리됨) */}
        <button
          className={styles.detailButton}
          onClick={handleDetailClick}
          aria-label={`View ${targetName} details`}
        >
          <ChevronRight size={20} />
        </button>

        {/* 투표 성공 하이라이트 효과 */}
        {isVoted && (
          <motion.div
            className={styles.voteEffect}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.li>
    );
  },
);

DashboardRankingItem.displayName = 'DashboardRankingItem';

export default DashboardRankingItem;
