import { afterEach, describe, expect, it, vi } from 'vitest';

import { getFingerprint } from './fingerprint';

const FINGERPRINT_KEY = 'kcl_fingerprint';

describe('getFingerprint', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('returns an existing fingerprint from localStorage', () => {
    localStorage.setItem(FINGERPRINT_KEY, 'stored-fingerprint');

    expect(getFingerprint()).toBe('stored-fingerprint');
  });

  it('uses crypto.randomUUID when available', () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => '00000000-0000-4000-8000-000000000000'),
    });

    expect(getFingerprint()).toBe('00000000-0000-4000-8000-000000000000');
    expect(localStorage.getItem(FINGERPRINT_KEY)).toBe('00000000-0000-4000-8000-000000000000');
  });

  it('falls back to getRandomValues when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: vi.fn((bytes: Uint8Array) => {
        bytes.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        return bytes;
      }),
    });

    const fingerprint = getFingerprint();

    expect(fingerprint).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
    expect(localStorage.getItem(FINGERPRINT_KEY)).toBe(fingerprint);
  });
});
