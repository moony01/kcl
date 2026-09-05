'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import {
  getMyFollowing,
  toggleFollow,
  FollowingError,
  type FollowTargetType,
  type FollowingState,
} from '@/lib/api/following';

const EMPTY_FOLLOWING: FollowingState = {
  companyIds: [],
  groupIds: [],
};

function getTargetKey(targetType: FollowTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

function updateFollowing(
  current: FollowingState,
  targetType: FollowTargetType,
  targetId: string,
  isFollowing: boolean,
): FollowingState {
  const key = targetType === 'company' ? 'companyIds' : 'groupIds';
  const ids = new Set(current[key]);
  if (isFollowing) ids.add(targetId);
  else ids.delete(targetId);

  return {
    ...current,
    [key]: [...ids],
  };
}

/** Authenticated follow state with optimistic UI and rollback on failure. */
export function useFollowing() {
  const { user, isAuthenticated } = useAuth();
  const key = user && isAuthenticated ? `following:${user.id}` : null;
  const { data, error, isLoading, mutate } = useSWR<FollowingState>(
    key,
    () => getMyFollowing(),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const following = data ?? EMPTY_FOLLOWING;

  const isFollowing = useCallback(
    (targetType: FollowTargetType, targetId: string) => {
      const ids = targetType === 'company' ? following.companyIds : following.groupIds;
      return ids.includes(targetId);
    },
    [following],
  );

  const toggle = useCallback(async (
    targetType: FollowTargetType,
    targetId: string,
    nextValue: boolean,
  ) => {
    if (!user) {
      throw new FollowingError('로그인 후 이용할 수 있습니다.', 'AUTH_REQUIRED');
    }

    const targetKey = getTargetKey(targetType, targetId);
    const previous = following;
    const optimistic = updateFollowing(previous, targetType, targetId, nextValue);
    setPendingTarget(targetKey);
    await mutate(optimistic, false);

    try {
      const confirmed = await toggleFollow(targetType, targetId, nextValue);
      await mutate(updateFollowing(optimistic, targetType, targetId, confirmed), false);
      return confirmed;
    } catch (cause) {
      await mutate(previous, false);
      throw cause;
    } finally {
      setPendingTarget((current) => (current === targetKey ? null : current));
    }
  }, [following, mutate, user]);

  const reload = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    following,
    error: error || null,
    isLoading,
    isFollowing,
    pendingTarget,
    toggle,
    reload,
  };
}

export default useFollowing;
