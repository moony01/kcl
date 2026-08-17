import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomeBoardHeader from './HomeBoardHeader';

vi.mock('next-intl', () => ({
  useTranslations: () => (_key: string, values?: { max?: number }) =>
    `* 카드를 길게 누르고 ${values?.max ?? ''}표 투표하기`,
}));

const season = { year: 2026, month: 8, daysRemaining: 14 };
const expectedMetaSlots = ['home-today-votes', 'home-refresh-indicator', 'home-season-dday'];

function getMetaSlotIds() {
  const quota = screen.getByTestId('home-today-votes');
  const meta = quota.parentElement;

  if (!meta) {
    throw new Error('Expected today-votes to be inside homeHeaderMeta');
  }

  return Array.from(meta.children).map((child) => child.getAttribute('data-testid'));
}

describe('HomeBoardHeader', () => {
  it('keeps quota, refresh, and D-day in stable meta slots across countdown states', () => {
    const { rerender } = render(
      <HomeBoardHeader
        season={season}
        quotaRemaining={0}
        countdown={10}
        isRefreshing={false}
      />,
    );

    expect(getMetaSlotIds()).toEqual(expectedMetaSlots);
    expect(screen.getByTestId('home-today-votes').textContent).toBe('오늘 0표 남음');
    expect(screen.getByTestId('home-refresh-indicator').textContent).toBe('10초');
    expect(screen.getByTestId('home-season-dday').textContent).toBe('D-14');

    rerender(
      <HomeBoardHeader
        season={season}
        quotaRemaining={0}
        countdown={1}
        isRefreshing={false}
      />,
    );

    expect(getMetaSlotIds()).toEqual(expectedMetaSlots);
    expect(screen.getByTestId('home-refresh-indicator').textContent).toBe('1초');
    expect(screen.getByTestId('home-season-dday').textContent).toBe('D-14');

    rerender(
      <HomeBoardHeader season={season} quotaRemaining={0} countdown={20} isRefreshing />,
    );

    expect(getMetaSlotIds()).toEqual(expectedMetaSlots);
    expect(screen.getByTestId('home-today-votes').textContent).toBe('오늘 0표 남음');
    expect(screen.getByTestId('home-refresh-indicator').textContent).toBe('갱신 중…');
    expect(screen.getByTestId('home-season-dday').textContent).toBe('D-14');
  });

  it('shows the home-only card voting helper directly below the season label', () => {
    render(
      <HomeBoardHeader
        season={season}
        quotaRemaining={100}
        countdown={20}
        isRefreshing={false}
        showVoteHelper
        voteHelperMax={100}
      />,
    );

    const seasonLabel = screen.getByTestId('home-season-label');
    const helper = screen.getByTestId('home-vote-helper');

    expect(helper.textContent).toBe('* 카드를 길게 누르고 100표 투표하기');
    expect(seasonLabel.nextElementSibling).toBe(helper);
    expect(helper.style.pointerEvents).toBe('none');
  });

  it('does not add the helper to shared header/embed layouts by default', () => {
    render(
      <HomeBoardHeader
        season={season}
        quotaRemaining={100}
        countdown={20}
        isRefreshing={false}
      />,
    );

    expect(screen.queryByTestId('home-vote-helper')).toBeNull();
  });
});
