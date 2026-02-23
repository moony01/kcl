import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar/index';
import BottomNav from './BottomNav/index';
import { NextIntlClientProvider } from 'next-intl';

// next/navigation mock
vi.mock('next/navigation', () => ({
  usePathname: () => '/ko',
}));

// next/link mock
vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
      className,
    }: {
      children: React.ReactNode;
      href: string;
      className?: string;
    }) => {
      return (
        <a href={href} className={className}>
          {children}
        </a>
      );
    },
  };
});

// useAuth mock — 비로그인 상태
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: null,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
}));

// framer-motion mock — BottomNav에서 motion.div 사용
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

// 현재 Feature Flags 기준 Nav 메시지 (ANALYTICS_PAGE=false, COMMUNITY_PAGE=false)
const messages = {
  Nav: {
    home: '홈',
    analytics: '통계',
    hall_of_fame: '명예의 전당',
    news: '뉴스',
    community: '커뮤니티',
    notice: '공지사항',
    ranking: '랭킹',
    theme: '테마',
    login: '로그인',
    logout: '로그아웃',
    my: '마이',
  },
};

describe('Navigation Components', () => {
  it('Sidebar는 Feature Flags에 따라 활성 메뉴만 렌더링한다', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>,
    );

    // 활성 메뉴: 홈, 명예의 전당, 뉴스, 공지사항
    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('명예의 전당')).toBeDefined();
    expect(screen.getByText('뉴스')).toBeDefined();
    expect(screen.getByText('공지사항')).toBeDefined();

    // 비활성 메뉴: 통계(ANALYTICS_PAGE=false), 커뮤니티(COMMUNITY_PAGE=false)
    expect(screen.queryByText('통계')).toBeNull();
    expect(screen.queryByText('커뮤니티')).toBeNull();
    // 랭킹은 네비게이션에 없어야 함
    expect(screen.queryByText('랭킹')).toBeNull();

    // AUTH_SYSTEM=true이므로 로그인 링크 표시 (비로그인 상태)
    expect(screen.getByText('로그인')).toBeDefined();
  });

  it('BottomNav는 Feature Flags에 따라 활성 메뉴만 렌더링한다', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <BottomNav />
      </NextIntlClientProvider>,
    );

    // 활성 메뉴: 홈, 명예의 전당, 뉴스, 공지사항
    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('명예의 전당')).toBeDefined();
    expect(screen.getByText('뉴스')).toBeDefined();
    expect(screen.getByText('공지사항')).toBeDefined();

    // 비활성 메뉴: 통계, 커뮤니티
    expect(screen.queryByText('통계')).toBeNull();
    expect(screen.queryByText('커뮤니티')).toBeNull();
    // 랭킹은 네비게이션에 없어야 함
    expect(screen.queryByText('랭킹')).toBeNull();

    // AUTH_SYSTEM=true이므로 로그인 표시 (비로그인 상태)
    expect(screen.getByText('로그인')).toBeDefined();
  });
});
