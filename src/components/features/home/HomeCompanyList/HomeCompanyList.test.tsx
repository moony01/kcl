import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { CompanyRanking } from '@/types/league';
import HomeCompanyList from './index';

vi.mock('next/image', () => ({
  default: ({
    loader,
    src,
    alt,
    className,
  }: {
    loader?: ({ src, width }: { src: string; width: number }) => string;
    src: string;
    alt: string;
    className?: string;
  }) => (
    // The test double intentionally renders the underlying element instead of
    // importing Next's runtime image implementation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={loader ? loader({ src, width: 48 }) : src}
      alt={alt}
      className={className}
      data-testid="home-company-logo"
      data-image-loader={loader ? 'custom' : 'default'}
    />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
}));

const ygCompany: CompanyRanking = {
  companyId: 'ba57c11a-bf5b-4058-93e8-449c572d72c2',
  companyName: 'YG',
  nameKo: 'YG',
  nameEn: 'YG',
  logoUrl: '/images/logos/yg_fan_art.webp',
  gradientColor: '#111111',
  rank: 1,
  previousRank: 1,
  rankChange: 0,
  voteCount: 7630,
  voteCountHourly: 0,
  tier: 'premier',
  isRelegationZone: false,
  isPromotionZone: false,
  promotionStatus: 'safe',
  artists: { en: [], ko: [] },
};

function createRankedCompany(rank: number): CompanyRanking {
  return {
    ...ygCompany,
    companyId: `company-${rank}`,
    companyName: `Company ${rank}`,
    nameKo: `회사 ${rank}`,
    nameEn: `Company ${rank}`,
    rank,
  };
}

describe('HomeCompanyList image contract', () => {
  it('passes a custom loader to next/image for official SVG logos', () => {
    render(
      <HomeCompanyList
        companies={[ygCompany]}
        quotaRemaining={100}
        isAuthLoading={false}
        isQuotaLoading={false}
        isVoteLoading={false}
        voteStates={{}}
        onVote={() => undefined}
      />,
    );

    const logo = screen.getByTestId('home-company-logo');
    expect(logo.getAttribute('src')).toBe('/images/company-logos/yg.svg');
    expect(logo.getAttribute('data-image-loader')).toBe('custom');
  });
});

describe('HomeCompanyList home surface', () => {
  it('rank 4 바로 위에 기존 Kpopface 광고 카드를 삽입한다', () => {
    render(
      <HomeCompanyList
        companies={[1, 2, 3, 4].map(createRankedCompany)}
        quotaRemaining={100}
        isAuthLoading={false}
        isQuotaLoading={false}
        isVoteLoading={false}
        voteStates={{}}
        onVote={() => undefined}
      />,
    );

    const adSlot = screen.getByTestId('home-kpopface-ad-slot');
    const rankFour = screen.getByRole('button', { name: /4위/ });

    expect(adSlot.querySelector('[data-ad-slot="kpopface"]')).not.toBeNull();
    expect(
      Boolean(adSlot.compareDocumentPosition(rankFour) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true);
  });
});
