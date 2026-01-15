import { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { MessageSquare, PenSquare } from 'lucide-react';
import { PostList } from '@/components/features/community';
import type { Post } from '@/types/community';
import styles from './page.module.scss';

/**
 * 커뮤니티 목록 페이지 Props
 */
interface CommunityPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Mock 데이터 (API 연동 전)
 */
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    nickname: '팬123',
    title: 'HYBE 투표 인증합니다!',
    content: '오늘도 열심히 투표했어요~ 모두 화이팅! 우리 아티스트를 위해 끝까지 함께해요.',
    view_count: 42,
    comment_count: 3,
    created_at: '2026-01-15T10:30:00Z',
  },
  {
    id: '2',
    nickname: 'BLINK_forever',
    title: 'YG 엔터 신인 아이돌 데뷔 소식!',
    content: '새로운 걸그룹이 곧 데뷔한다고 합니다. 기대되네요!',
    view_count: 128,
    comment_count: 15,
    created_at: '2026-01-14T18:45:00Z',
  },
  {
    id: '3',
    nickname: '케이팝러버',
    title: '이번 달 리그 예상해보아요',
    content: '이번 달은 SM이 1위할 것 같은데... 여러분 예상은요?',
    view_count: 89,
    comment_count: 22,
    created_at: '2026-01-14T09:15:00Z',
  },
  {
    id: '4',
    nickname: 'JYP_fan',
    title: '트와이스 컴백 정보 공유합니다',
    content: '다음 달에 새 앨범이 나온다고 해요! 미리 투표권 모아두세요~',
    view_count: 256,
    comment_count: 31,
    created_at: '2026-01-13T14:20:00Z',
  },
  {
    id: '5',
    nickname: 'MusicLover',
    title: '투표 팁 공유해요!',
    content:
      '매일 자정에 투표권이 리셋되니까 꼭 챙기세요. 시간대별로 나눠서 투표하면 효과적이에요.',
    view_count: 445,
    comment_count: 28,
    created_at: '2026-01-12T21:00:00Z',
  },
];

/**
 * 페이지 메타데이터 생성
 */
export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Community' });

  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      type: 'website',
    },
  };
}

/**
 * 커뮤니티 목록 페이지
 * 게시글 목록 + 글쓰기 버튼
 */
export default async function CommunityPage({ params }: CommunityPageProps) {
  const { locale } = await params;

  // next-intl 정적 생성 지원
  setRequestLocale(locale);

  // 번역 가져오기
  const t = await getTranslations({ locale, namespace: 'Community' });

  // TODO: API 연동 후 실제 데이터로 교체
  const posts = MOCK_POSTS;

  return (
    <main className={styles.container}>
      {/* 페이지 헤더 */}
      <header className={styles.header}>
        <div className={styles.titleWrapper}>
          <MessageSquare size={28} className={styles.icon} />
          <h1 className={styles.title}>{t('title')}</h1>
        </div>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </header>

      {/* 액션 바 */}
      <div className={styles.actionBar}>
        <Link href={`/${locale}/community/write`} className={styles.writeBtn}>
          <PenSquare size={18} />
          <span>{t('write')}</span>
        </Link>
      </div>

      {/* 게시글 목록 */}
      <PostList posts={posts} />
    </main>
  );
}
