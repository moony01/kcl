import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar/index';
import BottomNav from './BottomNav/index';
import { NextIntlClientProvider } from 'next-intl';

// Mock useRouter
vi.mock('next/navigation', () => ({
  usePathname: () => '/ko',
}));

// Mock Link
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

const messages = {
  Nav: {
    home: '홈',
    analytics: '통계',
    hall_of_fame: '명예의 전당',
    news: '뉴스',
    community: '커뮤니티',
    ranking: '랭킹',
    theme: '테마',
  },
};

describe('Navigation Components', () => {
  it('Sidebar renders all navigation items correctly', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>,
    );

    // 네비게이션에 포함된 항목들 확인
    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('통계')).toBeDefined();
    expect(screen.getByText('명예의 전당')).toBeDefined();
    expect(screen.getByText('뉴스')).toBeDefined();
    expect(screen.getByText('커뮤니티')).toBeDefined();
    // 랭킹은 네비게이션에 없어야 함 (주석 처리됨)
    expect(screen.queryByText('랭킹')).toBeNull();
  });

  it('BottomNav renders all navigation items correctly', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <BottomNav />
      </NextIntlClientProvider>,
    );

    // 네비게이션에 포함된 항목들 확인
    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('통계')).toBeDefined();
    expect(screen.getByText('명예의 전당')).toBeDefined();
    expect(screen.getByText('뉴스')).toBeDefined();
    expect(screen.getByText('커뮤니티')).toBeDefined();
    // 랭킹은 네비게이션에 없어야 함 (주석 처리됨)
    expect(screen.queryByText('랭킹')).toBeNull();
  });
});
