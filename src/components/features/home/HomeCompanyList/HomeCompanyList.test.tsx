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

const ygCompany: CompanyRanking = {
  companyId: 'ba57c11a-bf5b-4058-93e8-449c572d72c2',
  companyName: 'YG',
  nameKo: 'YG',
  nameEn: 'YG',
  logoUrl: '/images/logos/yg_fan_art.jpeg',
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
