'use client';

/**
 * useAuth 커스텀 훅
 *
 * AuthProvider가 제공하는 인증 컨텍스트를 편리하게 소비하기 위한 훅입니다.
 * AuthProvider 외부에서 호출하면 에러를 던집니다.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, profile, isAuthenticated, signOut } = useAuth();
 *
 *   if (!isAuthenticated) return <LoginButton />;
 *   return <span>{profile?.username}</span>;
 * }
 * ```
 */

import { useContext } from 'react';
import { AuthContext } from '@/components/providers/AuthProvider';
import type { AuthContextType } from '@/components/providers/AuthProvider';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      '[useAuth] AuthProvider 내부에서만 사용할 수 있습니다. ' +
        'layout.tsx에서 <AuthProvider>로 감싸져 있는지 확인하세요.',
    );
  }

  return context;
}
