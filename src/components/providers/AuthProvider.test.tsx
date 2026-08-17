import { act, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthProvider, { AuthContext } from './AuthProvider';
import {
  DEVELOPMENT_TEST_MODE_STORAGE_KEY,
  DEVELOPMENT_TEST_USER_ID,
} from '@/lib/auth/development-test-mode';

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: mocks.getSupabase,
}));

function AuthProbe() {
  const { isLoading, user, profile, signOut } = useContext(AuthContext);

  return (
    <>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.id ?? 'guest'}</span>
      <span data-testid="profile">{profile?.username ?? 'none'}</span>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </>
  );
}

describe('AuthProvider development test mode', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.clear();
    mocks.getSupabase.mockReset();
    mocks.getSession.mockReset();
    mocks.onAuthStateChange.mockReset();
    mocks.signOut.mockReset();
    mocks.getSession.mockResolvedValue({ data: { session: null } });
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.getSupabase.mockReturnValue({
      auth: {
        getSession: mocks.getSession,
        onAuthStateChange: mocks.onAuthStateChange,
        signOut: mocks.signOut,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('provides a local authenticated user without initializing or calling Supabase', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(screen.getByTestId('user').textContent).toBe(DEVELOPMENT_TEST_USER_ID);
    expect(screen.getByTestId('profile').textContent).toBe('Developer Test');
    expect(mocks.getSupabase).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('clears the local marker on sign-out without calling Supabase in test mode', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Sign out' }).click();
    });

    expect(window.localStorage.getItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('profile').textContent).toBe('none');
    expect(mocks.getSupabase).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('does not treat a stale marker as test mode in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(mocks.getSupabase).toHaveBeenCalledTimes(1);
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.onAuthStateChange).toHaveBeenCalledTimes(1);
  });
});
