/**
 * CompanyDetailClient.tsx
 *
 * 회사 상세 페이지 클라이언트 컴포넌트
 * 회사 정보, 파이어파워 트렌드, 소속 그룹, 댓글을 표시합니다.
 *
 * 참고: Support(투표)는 홈 화면 전용 기능으로, 상세 페이지에서는 홈으로 유도합니다.
 *
 * @updated T1.10 - Mock → Supabase API 연동
 */

'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, TrendingUp, Home, Users, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCompanyData, useCompanyGroups } from '@/hooks/useCompanyData';
import styles from './page.module.scss';
import CommentSection from '@/components/features/comments/CommentSection';
import Tabs from '@/components/common/Tabs';

// 차트 컴포넌트 동적 로딩 (SSR 비활성화)
const StockChart = dynamic(() => import('@/components/features/chart/StockChart'), { ssr: false });

interface CompanyDetailClientProps {
  locale: string;
  id: string;
}

export default function CompanyDetailClient({ locale, id }: CompanyDetailClientProps) {
  const t = useTranslations('Home');

  // 🔥 Supabase API에서 데이터 가져오기
  const { company, groups, isLoading, error, refresh } = useCompanyData(id);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading company data...</p>
        </div>
      </div>
    );
  }

  // 에러 또는 데이터 없음
  if (error || !company) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href={`/${locale}/ranking`} className={styles.backBtn}>
            <ArrowLeft size={24} />
          </Link>
          <span className={styles.title}>Company</span>
          <div style={{ width: 24 }} />
        </div>
        <div className={styles.errorState}>
          <p>Company not found</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      </div>
    );
  }

  // 로케일에 맞는 회사명 가져오기
  const targetName = locale === 'ko' ? company.name_ko : company.name_en;

  // gradient 스타일 생성
  const gradientStyle = company.gradient_color?.startsWith('linear-gradient')
    ? company.gradient_color
    : `linear-gradient(135deg, ${company.gradient_color || '#8B5CF6'} 0%, #1A1A1A 100%)`;

  // Mock 주가 히스토리 (TODO: 실제 투표 히스토리 API로 대체)
  const stockHistory = generateMockHistory(company.firepower);

  // 페이지 전환 애니메이션 설정
  const pageVariants = {
    initial: { x: '100%' },
    animate: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { x: '100%', transition: { duration: 0.2 } },
  } as const;

  return (
    <motion.div
      className={styles.container}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* 상세 페이지 헤더 (뒤로가기 + 제목) */}
      <div className={styles.header}>
        <Link href={`/${locale}/ranking`} className={styles.backBtn}>
          <ArrowLeft size={24} />
        </Link>
        <span className={styles.title}>{targetName}</span>
        <button onClick={() => refresh()} className={styles.refreshBtn}>
          <RefreshCw size={18} />
        </button>
      </div>

      <main className={styles.content}>
        {/* 회사 정보 카드 */}
        <motion.div
          className={styles.companyCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{ background: gradientStyle }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.rankBadge}>No. {company.rank}</div>
            {/* 홈에서 서포트하기 링크 (Support 버튼 대체) */}
            <Link
              href={`/${locale}`}
              className={styles.supportLink}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: '20px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                textDecoration: 'none',
                fontSize: '0.85rem',
              }}
            >
              <Home size={16} />
              홈에서 서포트
            </Link>
          </div>

          <div className={styles.firepower} style={{ marginBottom: '12px' }}>
            <TrendingUp size={16} />
            <span>{company.firepower.toLocaleString()}</span>
          </div>

          <h1 className={styles.companyName}>{targetName}</h1>
          <p className={styles.companyId}>K-Pop Entertainment</p>
        </motion.div>

        {/* 파이어파워 트렌드 차트 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Firepower Trend</h2>
          {stockHistory && (
            <div style={{ width: '100%', height: '250px' }}>
              <StockChart data={stockHistory} color={gradientStyle} />
            </div>
          )}
        </section>

        {/* 소속 그룹 목록 */}
        <section className={styles.section}>
          <GroupsSection groups={groups} locale={locale} />
        </section>

        {/* 댓글 섹션 */}
        <section className={styles.section}>
          <CommentSection />
        </section>
      </main>
    </motion.div>
  );
}

/**
 * Mock 주가 히스토리 생성
 * TODO: 실제 투표 히스토리 API로 대체
 */
function generateMockHistory(currentValue: number) {
  const history = [];
  let value = currentValue * 0.9;
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * 0.06;
    value = Math.max(0, value * (1 + change));
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value),
    });
  }

  if (history.length > 0) {
    history[history.length - 1].value = currentValue;
  }

  return history;
}

/**
 * GroupsSection
 *
 * 소속 그룹(아티스트) 목록을 표시하는 섹션
 */
interface GroupsSectionProps {
  groups: Array<{
    id: string;
    name_ko: string;
    name_en: string;
    debut_date: string | null;
    member_count: number | null;
    group_type: string | null;
    is_active: boolean;
  }>;
  locale: string;
}

function GroupsSection({ groups, locale }: GroupsSectionProps) {
  if (groups.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Users size={32} />
        <p>No artist data available yet.</p>
      </div>
    );
  }

  // 그룹 타입별 분류
  const boyGroups = groups.filter((g) => g.group_type === 'boy');
  const girlGroups = groups.filter((g) => g.group_type === 'girl');
  const soloArtists = groups.filter((g) => g.group_type === 'solo');
  const otherGroups = groups.filter((g) => !['boy', 'girl', 'solo'].includes(g.group_type || ''));

  const renderGroupList = (items: typeof groups) => (
    <div className={styles.groupList}>
      {items.map((group) => (
        <div key={group.id} className={styles.groupItem}>
          <span className={styles.groupName}>
            {locale === 'ko' ? group.name_ko : group.name_en}
          </span>
          {group.member_count && (
            <span className={styles.memberCount}>{group.member_count} members</span>
          )}
          {group.debut_date && (
            <span className={styles.debutDate}>{new Date(group.debut_date).getFullYear()}</span>
          )}
        </div>
      ))}
    </div>
  );

  // 탭 아이템 정의
  const tabItems = [
    ...(boyGroups.length > 0
      ? [
          {
            id: 'boy',
            label: `Boy Groups (${boyGroups.length})`,
            content: renderGroupList(boyGroups),
          },
        ]
      : []),
    ...(girlGroups.length > 0
      ? [
          {
            id: 'girl',
            label: `Girl Groups (${girlGroups.length})`,
            content: renderGroupList(girlGroups),
          },
        ]
      : []),
    ...(soloArtists.length > 0
      ? [
          {
            id: 'solo',
            label: `Solo (${soloArtists.length})`,
            content: renderGroupList(soloArtists),
          },
        ]
      : []),
    ...(otherGroups.length > 0
      ? [
          {
            id: 'other',
            label: `Other (${otherGroups.length})`,
            content: renderGroupList(otherGroups),
          },
        ]
      : []),
  ];

  // 탭이 하나만 있으면 탭 없이 바로 표시
  if (tabItems.length === 1) {
    return (
      <>
        <h2 className={styles.sectionTitle}>Artists ({groups.length})</h2>
        {tabItems[0].content}
      </>
    );
  }

  return (
    <>
      <h2 className={styles.sectionTitle}>Artists ({groups.length})</h2>
      <Tabs items={tabItems} />
    </>
  );
}
