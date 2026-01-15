'use client';

export const runtime = 'edge';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { PostDetail, CommentSection, ReportModal } from '@/components/features/community';
import type { Post, Comment } from '@/types/community';
import styles from './page.module.scss';

/**
 * Mock 데이터 (API 연동 전)
 */
const MOCK_POST: Post = {
  id: '1',
  nickname: '팬123',
  title: 'HYBE 투표 인증합니다!',
  content: `오늘도 열심히 투표했어요~ 모두 화이팅!

우리 아티스트를 위해 끝까지 함께해요.
매일 자정에 투표권이 리셋되니까 꼭 챙기세요!

같이 응원하는 분들 댓글 남겨주세요 💜`,
  view_count: 42,
  comment_count: 3,
  created_at: '2026-01-15T10:30:00Z',
};

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    post_id: '1',
    nickname: 'ARMY_forever',
    content: '저도 오늘 투표했어요! 함께 파이팅 💜',
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: '2',
    post_id: '1',
    nickname: '케이팝팬',
    content: '좋은 정보 감사합니다~',
    created_at: '2026-01-15T12:30:00Z',
  },
  {
    id: '3',
    post_id: '1',
    nickname: 'musiclover',
    content: '매일 꾸준히 투표하고 있어요!',
    created_at: '2026-01-15T14:45:00Z',
  },
];

/**
 * 게시글 상세 페이지
 */
export default function PostDetailPage() {
  const params = useParams();
  const t = useTranslations('Community');
  const locale = (params.locale as string) || 'ko';
  const postId = params.id as string;

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: string;
  } | null>(null);

  // TODO: API 연동 후 실제 데이터 fetch
  const post = { ...MOCK_POST, id: postId };
  const comments = MOCK_COMMENTS;

  /** 게시글 신고 */
  const handleReportPost = () => {
    setReportTarget({ type: 'post', id: postId });
    setReportModalOpen(true);
  };

  /** 댓글 신고 */
  const handleReportComment = (commentId: string) => {
    setReportTarget({ type: 'comment', id: commentId });
    setReportModalOpen(true);
  };

  return (
    <main className={styles.container}>
      {/* 헤더 */}
      <header className={styles.header}>
        <Link href={`/${locale}/community`} className={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>{t('back_to_list')}</span>
        </Link>
      </header>

      {/* 게시글 상세 */}
      <PostDetail post={post} onReport={handleReportPost} />

      {/* 댓글 섹션 */}
      <CommentSection comments={comments} postId={postId} onReportComment={handleReportComment} />

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </main>
  );
}
