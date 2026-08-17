import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './index';
import { DEVELOPMENT_TEST_MODE_STORAGE_KEY } from '@/lib/auth/development-test-mode';
import { VOTE_QUOTA_STORAGE_KEY } from '@/lib/vote-quota';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signInWithOAuth: vi.fn(),
  reloadDevelopmentTestPage: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/auth/development-test-mode', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/development-test-mode')>(
    '@/lib/auth/development-test-mode',
  );

  return {
    ...actual,
    reloadDevelopmentTestPage: mocks.reloadDevelopmentTestPage,
  };
});

describe('LoginForm development controls', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.clear();
    mocks.createClient.mockReset();
    mocks.signInWithOAuth.mockReset();
    mocks.reloadDevelopmentTestPage.mockReset();
    mocks.createClient.mockReturnValue({
      auth: { signInWithOAuth: mocks.signInWithOAuth },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the controls only in development and keeps test mode guest-only', () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(<LoginForm />);

    expect(screen.getByTestId('developer-auth-tools')).toBeDefined();
    expect(screen.getByTestId('guest-quota-reset')).toBeDefined();
    expect(screen.getByTestId('developer-test-mode-status').textContent).toContain(
      'guest-only',
    );
    expect((screen.getByRole('button', { name: 'google_login' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('persists the toggle before refreshing and restores the active status', () => {
    const { unmount } = render(<LoginForm />);

    fireEvent.click(screen.getByTestId('developer-test-mode-toggle'));

    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBe('true');
    expect(mocks.reloadDevelopmentTestPage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('developer-test-mode-status').textContent).toContain('guest-only');

    unmount();
    render(<LoginForm />);

    expect(screen.getByTestId('developer-test-mode-toggle').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByTestId('developer-test-mode-status').textContent).toContain('guest-only');
  });

  it('resets only the local guest quota from the development control', () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByTestId('guest-quota-reset'));

    expect(JSON.parse(window.localStorage.getItem(VOTE_QUOTA_STORAGE_KEY) ?? '')).toMatchObject({
      used: 0,
      max: 100,
    });
  });

  it('does not render development controls in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(<LoginForm />);

    expect(screen.queryByTestId('developer-auth-tools')).toBeNull();
    expect(screen.queryByTestId('guest-quota-reset')).toBeNull();
    expect((screen.getByRole('button', { name: 'google_login' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
