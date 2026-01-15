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
    report: '제보/문의',
    ranking: '랭킹',
    theme: '테마',
  },
};

describe('Navigation Components', () => {
  it('Sidebar renders Home and Report, but not Ranking', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('제보/문의')).toBeDefined();
    expect(screen.queryByText('랭킹')).toBeNull();
  });

  it('BottomNav renders Home and Report, but not Ranking', () => {
    render(
      <NextIntlClientProvider locale="ko" messages={messages}>
        <BottomNav />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText('홈')).toBeDefined();
    expect(screen.getByText('제보/문의')).toBeDefined();
    expect(screen.queryByText('랭킹')).toBeNull();
  });
});
