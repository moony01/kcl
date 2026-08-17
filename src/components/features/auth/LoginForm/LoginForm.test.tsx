import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import LoginForm from './index';
import { DEVELOPMENT_TEST_MODE_STORAGE_KEY } from '@/lib/auth/development-test-mode';
import { VOTE_QUOTA_STORAGE_KEY } from '@/lib/vote-quota';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  signInWithOAuth: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: mocks.routerReplace }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: mocks.createClient,
}));

describe('LoginForm development controls', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.clear();
    mocks.createClient.mockReset();
    mocks.signInWithOAuth.mockReset();
    mocks.routerReplace.mockReset();
    mocks.createClient.mockReturnValue({
      auth: { signInWithOAuth: mocks.signInWithOAuth },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the controls only in development and exposes the local authenticated test session', () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(<LoginForm />);

    expect(screen.getByTestId('developer-auth-tools')).toBeDefined();
    expect(screen.getByTestId('guest-quota-reset')).toBeDefined();
    expect(screen.getByTestId('developer-test-mode-status').textContent).toContain(
      'local authenticated user',
    );
    expect((screen.getByRole('button', { name: 'google_login' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it('keeps the server markup independent of the browser test-mode marker', () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    const markup = renderToString(<LoginForm />);

    expect(markup).toContain('Developer test login');
    expect(markup).toContain('aria-pressed="false"');
    expect(markup).not.toContain('disabled=""');
  });

  it('activates the local developer login and routes to the local home', () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByTestId('developer-test-mode-toggle'));

    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBe('true');
    expect(mocks.routerReplace).toHaveBeenCalledWith('/ko');
    expect(screen.getByTestId('developer-test-mode-status').textContent).toContain(
      'local authenticated user',
    );
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
