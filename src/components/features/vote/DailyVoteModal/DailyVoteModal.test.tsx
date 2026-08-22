import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DailyVoteModal from './index';

const mocks = vi.hoisted(() => ({
  locale: 'ko',
  pathname: '/ko/news',
}));

vi.mock('next-intl', () => ({
  useLocale: () => mocks.locale,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
}));

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

async function expectRenderOnlyClose(close: () => void) {
  const firstRender = render(<DailyVoteModal />);
  await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });

  close();

  await waitFor(() => {
    expect(screen.queryByRole('dialog', { name: '실시간 TOP 10 투표' })).toBeNull();
  });
  expect(window.localStorage.getItem('kcl-daily-vote-modal-dismissed-date')).toBeNull();
  expect(window.sessionStorage.getItem('kcl-daily-vote-modal-dismissed-session')).toBeNull();

  firstRender.unmount();
  const remount = render(<DailyVoteModal />);
  await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });

  remount.unmount();
  mocks.pathname = '/ko/news/gangnam-style-6-billion';
  render(<DailyVoteModal />);
  await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });
}

describe('DailyVoteModal', () => {
  beforeEach(() => {
    mocks.locale = 'ko';
    mocks.pathname = '/ko/news';
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.body.style.overflow = '';
  });

  it('첫 방문에는 TOP 10 직접 투표 임베드를 모달로 연다', async () => {
    render(<DailyVoteModal />);

    const dialog = await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });
    const iframe = screen.getByTitle('실시간 TOP 10 직접 투표');

    expect(dialog).toBeDefined();
    expect(iframe.getAttribute('src')).toBe('/embed/vote-board/ko?surface=kcl-modal&ads=off');
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  it('오늘 하루 보지 않기를 누르면 날짜를 저장하고 같은 날 다시 열지 않는다', async () => {
    const { unmount } = render(<DailyVoteModal />);
    await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });

    fireEvent.click(screen.getByRole('button', { name: '오늘 하루 보지 않기' }));

    expect(screen.queryByRole('dialog', { name: '실시간 TOP 10 투표' })).toBeNull();
    expect(window.localStorage.getItem('kcl-daily-vote-modal-dismissed-date')).toBe(
      getTodayKey(),
    );
    expect(window.sessionStorage.getItem('kcl-daily-vote-modal-dismissed-session')).toBeNull();

    unmount();
    render(<DailyVoteModal />);
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    });

    expect(screen.queryByRole('dialog', { name: '실시간 TOP 10 투표' })).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('X는 현재 렌더만 닫고 remount와 뉴스 재진입에서 다시 연다', async () => {
    await expectRenderOnlyClose(() => {
      fireEvent.click(screen.getByRole('button', { name: '투표 모달 닫기' }));
    });
  });

  it('배경은 현재 렌더만 닫고 remount와 뉴스 재진입에서 다시 연다', async () => {
    await expectRenderOnlyClose(() => {
      fireEvent.click(screen.getByRole('button', { name: '투표 모달 배경 닫기' }));
    });
  });

  it('Escape는 현재 렌더만 닫고 remount와 뉴스 재진입에서 다시 연다', async () => {
    await expectRenderOnlyClose(() => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });
  });

  it('하단 CTA는 현재 렌더만 닫고 remount와 뉴스 재진입에서 다시 연다', async () => {
    await expectRenderOnlyClose(() => {
      const cta = screen.getByRole('link', { name: '더 투표하러 가기' });
      cta.addEventListener('click', (event) => event.preventDefault(), { once: true });
      fireEvent.click(cta);
    });
  });

  it('하단 CTA는 기존 MEARROW 투표 영역으로 연결한다', async () => {
    render(<DailyVoteModal />);
    await screen.findByRole('dialog', { name: '실시간 TOP 10 투표' });

    expect(screen.getByRole('link', { name: '더 투표하러 가기' }).getAttribute('href')).toBe(
      '/ko#vote-station',
    );
  });

  it('인증 경로에서는 모달을 노출하거나 본문 스크롤을 잠그지 않는다', async () => {
    mocks.pathname = '/ko/login';
    render(<DailyVoteModal />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    });

    expect(screen.queryByRole('dialog', { name: '실시간 TOP 10 투표' })).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('홈에서는 이미 VoteBoard가 있으므로 모달을 노출하지 않는다', async () => {
    mocks.pathname = '/ko';
    render(<DailyVoteModal />);

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 30));
    });

    expect(screen.queryByRole('dialog', { name: '실시간 TOP 10 투표' })).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('임베드 미지원 locale은 영어 임베드로 안전하게 대체한다', async () => {
    mocks.locale = 'pt';
    mocks.pathname = '/pt/news';
    render(<DailyVoteModal />);

    await screen.findByRole('dialog', { name: 'Live TOP 10 vote' });
    expect(screen.getByTitle('Live TOP 10 direct voting').getAttribute('src')).toBe(
      '/embed/vote-board/en?surface=kcl-modal&ads=off',
    );
  });
});
