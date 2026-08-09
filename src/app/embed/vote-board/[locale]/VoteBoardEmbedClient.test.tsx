import { describe, expect, it } from 'vitest';
import { parseVoteBoardEmbedOptions } from './VoteBoardEmbedClient';

describe('parseVoteBoardEmbedOptions', () => {
  it('allows an explicit kpopface surface with ads enabled', () => {
    expect(parseVoteBoardEmbedOptions('?surface=kpopface&ads=on')).toEqual({
      surface: 'kpopface',
      showAds: true,
    });
  });

  it('defaults to a partner surface with ads disabled', () => {
    expect(parseVoteBoardEmbedOptions('')).toEqual({
      surface: 'partner',
      showAds: false,
    });
  });

  it('does not trust unsupported surface or ad values', () => {
    expect(parseVoteBoardEmbedOptions('?surface=javascript:alert(1)&ads=yes')).toEqual({
      surface: 'partner',
      showAds: false,
    });
  });
});
