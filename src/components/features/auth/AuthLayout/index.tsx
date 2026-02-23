"use client";

/**
 * AuthLayout - 인스타그램 벤치마킹 로그인 레이아웃
 *
 * 좌측 패널: 브랜드 히어로 영역 (퍼플 그라데이션 배경 + 플로팅 랭킹 카드 3개 + 장식 아이콘)
 * 우측 패널: 로그인/회원가입 폼 (최소한의 테두리, 부드러운 스타일)
 *
 * 디자인 포인트:
 * - 감성적인 좌측(브랜드) vs 기능적인 우측(폼) 분리
 * - CSS keyframes로 플로팅 애니메이션 (GPU 가속, prefers-reduced-motion 대응)
 * - 핵심 단어에만 그라데이션 텍스트 적용 (인스타그램 스타일)
 * - 모바일에서 좌측 패널 숨김, 우측 폼만 표시
 */

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import styles from './AuthLayout.module.scss';
import {
  Crown,
  Heart,
  Flame,
  Vote,
  TrendingUp,
  Users,
  Globe,
} from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  /** 하단 링크 (선택사항 - LoginForm/SignupForm 내부에서 자체 처리 시 생략 가능) */
  footerLink?: ReactNode;
}

/**
 * 모의 랭킹 데이터 - 좌측 패널의 플로팅 카드에 표시
 * 실제 데이터가 아닌 비주얼 데모용 하드코딩 데이터
 */
// 모의 랭킹 데이터 (소속사명은 고유명사로 번역 불필요)
const RANK_DATA = [
  { rank: 1, initial: 'Y', name: 'YG Ent.', firepower: '2,847', avatarStyle: 'avatarYG' as const },
  { rank: 2, initial: 'H', name: 'HYBE', firepower: '2,531', avatarStyle: 'avatarHY' as const },
  { rank: 3, initial: 'S', name: 'SM Ent.', firepower: '2,104', avatarStyle: 'avatarSM' as const },
];

/**
 * 카드 CSS 클래스 매핑 (순위별)
 * 1위: 골드 테두리 + 왕관, 2위: 실버 + 좌측 기울기, 3위: 브론즈 + 우측 기울기
 */
const CARD_CLASSES = [styles.cardFirst, styles.cardSecond, styles.cardThird];

export default function AuthLayout({ children, footerLink }: AuthLayoutProps) {
  const t = useTranslations('Auth');

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>

        {/* ========================================= */}
        {/* 좌측 패널: 브랜드 히어로 (데스크톱 전용) */}
        {/* ========================================= */}
        <div className={styles.leftPanel}>

          {/* 플로팅 장식 아이콘들 (은은한 opacity) */}
          <div className={styles.floatingIcons}>
            <Crown className={styles.floatingIcon} size={28} />
            <Heart className={styles.floatingIcon} size={22} />
            <Flame className={styles.floatingIcon} size={24} />
            <Vote className={styles.floatingIcon} size={20} />
          </div>

          {/* 메인 히어로 콘텐츠 */}
          <div className={styles.heroContent}>

            {/* 브랜드 로고 */}
            <span className={styles.heroBrand}>KCL</span>

            {/* 대형 헤드라인 - 핵심 단어에 그라데이션 */}
            <h2 className={styles.heroHeadline}>
              {t('hero_headline')}{' '}
              <span className={styles.gradientText}>{t('hero_highlight')}</span>
            </h2>

            {/* 플로팅 랭킹 카드 3개 (포디엄 레이아웃) */}
            <div className={styles.cardsArea}>
              {RANK_DATA.map((company, index) => (
                <div key={company.rank} className={CARD_CLASSES[index]}>
                  {/* 순위 배지 */}
                  <div className={styles.rankBadge}>
                    {company.rank === 1 && <Crown size={16} />}
                    {company.rank !== 1 && company.rank}
                  </div>

                  {/* 소속사 아바타 (이니셜) */}
                  <div className={`${styles.companyAvatar} ${styles[company.avatarStyle]}`}>
                    {company.initial}
                  </div>

                  {/* 소속사명 + firepower 수치 */}
                  <div className={styles.cardInfo}>
                    <span className={styles.companyName}>{company.name}</span>
                    <span className={styles.firepower}>
                      <Flame size={10} />
                      <strong>{company.firepower}</strong> FP
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 미니 통계 바 */}
            <div className={styles.statsBar}>
              <span className={styles.statItem}>
                <Users size={14} />
                {t('hero_stat_agencies')}
              </span>
              <span className={styles.statDivider} />
              <span className={styles.statItem}>
                <Globe size={14} />
                {t('hero_stat_languages')}
              </span>
              <span className={styles.statDivider} />
              <span className={styles.statItem}>
                <TrendingUp size={14} />
                {t('hero_stat_live')}
              </span>
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* 우측 패널: 로그인/회원가입 폼             */}
        {/* ========================================= */}
        <div className={styles.rightPanel}>
          <div className={styles.authBox}>
            <h1 className={styles.logo}>KCL</h1>
            {children}
          </div>

          {footerLink && (
            <div className={styles.subBox}>
              {footerLink}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
