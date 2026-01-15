/**
 * ProfileLayout (재설계)
 * 
 * KCL 앱에 맞춘 프로필 페이지 컴포넌트
 * 
 * 구성 요소:
 * 1. 프로필 헤더: 아바타, 유저네임, 최애 회사
 * 2. 통계 섹션: 총 투표수, 연속일(Streak), 글로벌 랭킹
 * 3. 서포트 기록: 회사별 투표 비율 (가로 막대 차트)
 * 4. 최근 활동: 타임라인
 * 5. 뱃지 컬렉션: 획득한 업적 표시
 */

"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Trophy, Flame, Award, Calendar, TrendingUp, Star } from 'lucide-react';
import styles from './ProfileLayout.module.scss';
import classNames from 'classnames';

// Mock 프로필 데이터
const MOCK_PROFILE = {
  username: "kcl_fan_123",
  handle: "@kcl_fan_123",
  favoriteCompany: "HYBE",
  avatar: null,
  
  stats: {
    totalVotes: 12340,
    streak: 15,
    globalRank: 42
  },
  
  supportHistory: [
    { companyId: "hybe", companyName: "HYBE", percentage: 65, totalPoints: 8021 },
    { companyId: "sm", companyName: "SM Entertainment", percentage: 20, totalPoints: 2468 },
    { companyId: "jyp", companyName: "JYP Entertainment", percentage: 10, totalPoints: 1234 },
    { companyId: "yg", companyName: "YG Entertainment", percentage: 5, totalPoints: 617 }
  ],
  
  recentActivity: [
    { date: "오늘", companyName: "HYBE", points: 100 },
    { date: "어제", companyName: "SM Entertainment", points: 50 },
    { date: "3일 전", companyName: "HYBE", points: 100 },
    { date: "4일 전", companyName: "JYP Entertainment", points: 30 },
    { date: "5일 전", companyName: "HYBE", points: 100 }
  ],
  
  badges: [
    { id: "streak-7", name: "열정팬", icon: "🔥", description: "7일 연속 투표", isLocked: false },
    { id: "multi-5", name: "올스타", icon: "⭐", description: "5개 이상 회사 투표", isLocked: false },
    { id: "focus-1000", name: "집중형", icon: "🎯", description: "한 회사에 1000포인트", isLocked: false },
    { id: "vip-10000", name: "VIP", icon: "💎", description: "총 10,000 포인트", isLocked: false },
    { id: "legend-100", name: "레전드", icon: "🌟", description: "글로벌 Top 100", isLocked: true },
    { id: "pioneer", name: "선구자", icon: "🚀", description: "첫 달 가입자", isLocked: true }
  ]
};

export default function ProfileLayout() {
  const [activeTab, setActiveTab] = useState<'support' | 'activity' | 'badges'>('support');

  return (
    <div className={styles.container}>
      {/* 프로필 헤더 */}
      <header className={styles.profileHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <span className={styles.avatarInitial}>
              {MOCK_PROFILE.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <button className={styles.settingsBtn} aria-label="설정">
            <Settings size={20} />
          </button>
        </div>
        
        <div className={styles.userInfo}>
          <h1 className={styles.username}>{MOCK_PROFILE.username}</h1>
          <p className={styles.handle}>{MOCK_PROFILE.handle}</p>
          <div className={styles.favoriteBadge}>
            <Trophy size={14} />
            <span>최애: {MOCK_PROFILE.favoriteCompany}</span>
          </div>
        </div>
      </header>

      {/* 통계 섹션 */}
      <section className={styles.statsSection}>
        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.02 }}
        >
          <Flame className={styles.statIcon} />
          <span className={styles.statValue}>
            {MOCK_PROFILE.stats.totalVotes.toLocaleString()}
          </span>
          <span className={styles.statLabel}>총 투표</span>
        </motion.div>
        
        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.02 }}
        >
          <Calendar className={styles.statIcon} />
          <span className={styles.statValue}>{MOCK_PROFILE.stats.streak}일</span>
          <span className={styles.statLabel}>연속 투표</span>
        </motion.div>
        
        <motion.div 
          className={styles.statCard}
          whileHover={{ scale: 1.02 }}
        >
          <TrendingUp className={styles.statIcon} />
          <span className={styles.statValue}>#{MOCK_PROFILE.stats.globalRank}</span>
          <span className={styles.statLabel}>글로벌 랭킹</span>
        </motion.div>
      </section>

      {/* 탭 네비게이션 */}
      <nav className={styles.tabNav}>
        <button 
          className={classNames(styles.tab, { [styles.active]: activeTab === 'support' })}
          onClick={() => setActiveTab('support')}
        >
          서포트 기록
        </button>
        <button 
          className={classNames(styles.tab, { [styles.active]: activeTab === 'activity' })}
          onClick={() => setActiveTab('activity')}
        >
          최근 활동
        </button>
        <button 
          className={classNames(styles.tab, { [styles.active]: activeTab === 'badges' })}
          onClick={() => setActiveTab('badges')}
        >
          뱃지
        </button>
      </nav>

      {/* 탭 콘텐츠 */}
      <div className={styles.tabContent}>
        {/* 서포트 기록 탭 */}
        {activeTab === 'support' && (
          <motion.div 
            className={styles.supportHistory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className={styles.sectionTitle}>
              <Award size={18} />
              회사별 서포트 현황
            </h3>
            <div className={styles.chartList}>
              {MOCK_PROFILE.supportHistory.map((item, idx) => (
                <div key={item.companyId} className={styles.chartItem}>
                  <div className={styles.chartInfo}>
                    <span className={styles.chartRank}>{idx + 1}</span>
                    <span className={styles.chartName}>{item.companyName}</span>
                    <span className={styles.chartPercent}>{item.percentage}%</span>
                  </div>
                  <div className={styles.chartBar}>
                    <motion.div 
                      className={styles.chartFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    />
                  </div>
                  <span className={styles.chartPoints}>
                    {item.totalPoints.toLocaleString()} pts
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 최근 활동 탭 */}
        {activeTab === 'activity' && (
          <motion.div 
            className={styles.activityTimeline}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} />
              최근 활동
            </h3>
            <ul className={styles.timeline}>
              {MOCK_PROFILE.recentActivity.map((activity, idx) => (
                <motion.li 
                  key={idx} 
                  className={styles.timelineItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className={styles.timelineDate}>{activity.date}</span>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineCompany}>{activity.companyName}</span>
                    <span className={styles.timelinePoints}>+{activity.points}pts</span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* 뱃지 컬렉션 탭 */}
        {activeTab === 'badges' && (
          <motion.div 
            className={styles.badgeCollection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className={styles.sectionTitle}>
              <Star size={18} />
              뱃지 컬렉션
            </h3>
            <div className={styles.badgeGrid}>
              {MOCK_PROFILE.badges.map((badge) => (
                <motion.div 
                  key={badge.id}
                  className={classNames(styles.badgeItem, { [styles.locked]: badge.isLocked })}
                  whileHover={{ scale: badge.isLocked ? 1 : 1.05 }}
                >
                  <span className={styles.badgeIcon}>{badge.icon}</span>
                  <span className={styles.badgeName}>{badge.name}</span>
                  <span className={styles.badgeDesc}>{badge.description}</span>
                  {badge.isLocked && (
                    <div className={styles.lockOverlay}>🔒</div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
