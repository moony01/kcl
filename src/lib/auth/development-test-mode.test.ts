import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearDevelopmentTestMode,
  DEVELOPMENT_TEST_MODE_STORAGE_KEY,
  isDevelopmentTestModeEnabled,
  setDevelopmentTestModeEnabled,
} from './development-test-mode';

describe('development test mode', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('uses a browser marker only in development', () => {
    vi.stubEnv('NODE_ENV', 'development');

    setDevelopmentTestModeEnabled(true);

    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBe('true');
    expect(isDevelopmentTestModeEnabled()).toBe(true);

    setDevelopmentTestModeEnabled(false);
    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBeNull();
  });

  it('ignores an existing marker in production', () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');
    vi.stubEnv('NODE_ENV', 'production');

    expect(isDevelopmentTestModeEnabled()).toBe(false);
    setDevelopmentTestModeEnabled(false);
    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBe('true');
  });

  it('clears the marker for sign-out cleanup', () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    clearDevelopmentTestMode();

    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBeNull();
  });
});
