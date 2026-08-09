import { describe, expect, it } from 'vitest';
import {
  getAllAuditionParams,
  getAllAuditions,
  getAuditionLocales,
} from './auditions';

describe('audition content routing', () => {
  it('generates detail routes only for translations that exist', () => {
    const params = getAllAuditionParams();

    expect(params).toEqual(
      expect.arrayContaining([
        { locale: 'ko', slug: '2026-yg-global-audition-osaka' },
        { locale: 'en', slug: '2026-yg-global-audition-osaka' },
        { locale: 'ko', slug: 'yg-online-audition' },
        { locale: 'en', slug: 'yg-online-audition' },
      ]),
    );
    expect(params.some(({ locale }) => locale === 'ja')).toBe(false);
  });

  it('reports only actual hreflang translations', () => {
    expect(getAuditionLocales('2026-yg-global-audition-osaka')).toEqual(['ko', 'en']);
  });

  it('uses English cards on untranslated list pages without changing their locale', () => {
    const japaneseList = getAllAuditions('ja');

    expect(japaneseList).toHaveLength(2);
    expect(japaneseList.every((post) => post.locale === 'en')).toBe(true);
  });

  it('puts a dated open audition before an ongoing listing', () => {
    const koreanList = getAllAuditions('ko');

    expect(koreanList.map((post) => post.slug)).toEqual([
      '2026-yg-global-audition-osaka',
      'yg-online-audition',
    ]);
  });
});
