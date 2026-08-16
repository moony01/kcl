/**
 * Development-only local test mode.
 *
 * This marker is a browser-local switch, not an authentication session. It is
 * deliberately ignored outside development so it cannot affect production
 * authentication behavior.
 */
export const DEVELOPMENT_TEST_MODE_STORAGE_KEY = 'kcl_dev_test_mode';

export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isDevelopmentTestModeEnabled(): boolean {
  if (!isDevelopmentEnvironment() || typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDevelopmentTestModeEnabled(enabled: boolean): void {
  if (!isDevelopmentEnvironment() || typeof window === 'undefined') return;

  try {
    if (enabled) {
      window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY);
    }
  } catch {
    // Private browsing/storage restrictions should not affect auth behavior.
  }
}

export function clearDevelopmentTestMode(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY);
  } catch {
    // Private browsing/storage restrictions should not block sign-out cleanup.
  }
}
