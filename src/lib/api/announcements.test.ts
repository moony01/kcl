import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@/lib/constants';
import {
  ANNOUNCEMENT_SOURCE_LOCALE,
  getAnnouncementAvailableLocales,
  getAnnouncementSeoLocale,
  SIGNUP_EVENT_NOTICE_ID,
} from './announcements';

describe('announcement SEO locale policy', () => {
  it('keeps the localized signup event available in every supported locale', () => {
    expect(getAnnouncementAvailableLocales(SIGNUP_EVENT_NOTICE_ID)).toEqual(SUPPORTED_LOCALES);
  });

  it('keeps generic database announcements on the English source locale', () => {
    expect(ANNOUNCEMENT_SOURCE_LOCALE).toBe('en');
    expect(getAnnouncementAvailableLocales('generic-db-announcement')).toEqual(['en']);
    expect(getAnnouncementSeoLocale('generic-db-announcement', 'ko')).toBe('en');
  });

  it('keeps the requested supported locale for the localized event', () => {
    expect(getAnnouncementSeoLocale(SIGNUP_EVENT_NOTICE_ID, 'ko')).toBe('ko');
  });
});
