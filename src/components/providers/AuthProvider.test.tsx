import { act, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AuthProvider, { AuthContext } from './AuthProvider';
import { DEVELOPMENT_TEST_MODE_STORAGE_KEY } from '@/lib/auth/development-test-mode';

const mocks = vi.hoisted(() => ({
  getSupabase: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: mocks.getSupabase,
}));

function AuthProbe() {
  const { isLoading, user, signOut } = useContext(AuthContext);

  return (
    <>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.id ?? 'guest'}</span>
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
    mocks.signOut.mockReset();
    mocks.getSupabase.mockReturnValue({
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
        signOut: mocks.signOut,
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stays guest-only without initializing or calling Supabase', async () => {
    window.localStorage.setItem(DEVELOPMENT_TEST_MODE_STORAGE_KEY, 'true');

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    expect(screen.getByTestId('user').textContent).toBe('guest');
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
    expect(mocks.getSupabase).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
