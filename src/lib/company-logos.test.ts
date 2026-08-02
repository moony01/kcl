import { describe, expect, it } from 'vitest';

import { getCompanyLogoBackground, getCompanyLogoUrl } from './company-logos';

describe('company logo registry', () => {
  it('prefers the official asset for a known company id', () => {
    expect(
      getCompanyLogoUrl(
        'ba57c11a-bf5b-4058-93e8-449c572d72c2',
        '/images/legacy-fan-art.jpg',
        'YG',
      ),
    ).toBe('/images/company-logos/yg.svg');
  });

  it('resolves mock and historical company names to the same official assets', () => {
    expect(getCompanyLogoUrl('co-hybe', undefined, 'HYBE')).toBe('/images/company-logos/hybe.svg');
    expect(getCompanyLogoUrl('co-jyp', undefined, 'JYP Entertainment')).toBe('/images/company-logos/jyp.png');
    expect(getCompanyLogoUrl('co-s2', undefined, 'S2')).toBe('/images/company-logos/s2.png');
  });

  it('keeps an unknown company fallback and derives a readable disc color', () => {
    expect(getCompanyLogoUrl('unknown-company', '/images/custom.svg', 'Unknown')).toBe('/images/custom.svg');
    expect(getCompanyLogoBackground('unknown-company', 'Unknown', '/images/custom.svg')).toBe('#fff');
    expect(getCompanyLogoBackground('co-high-up', 'High Up Entertainment')).toBe('#000');
  });
});
