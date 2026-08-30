'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  listPublicProfilePosts,
  PROFILE_FEED_PAGE_SIZE,
  type ProfileFeedCursor,
  type PublicProfilePostRecord,
} from '@/lib/api/profile-content';

export interface UsePublicProfileFeedReturn {
  posts: PublicProfilePostRecord[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
}

export function usePublicProfileFeed(): UsePublicProfileFeedReturn {
  const [posts, setPosts] = useState<PublicProfilePostRecord[]>([]);
  const [cursor, setCursor] = useState<ProfileFeedCursor | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async (nextCursor: ProfileFeedCursor | null, replace: boolean) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const page = await listPublicProfilePosts({
        cursor: nextCursor,
        limit: PROFILE_FEED_PAGE_SIZE,
      });
      if (requestId !== requestIdRef.current) return;

      setPosts((current) => {
        if (replace) return page.posts;
        const knownIds = new Set(current.map((post) => post.id));
        return [...current, ...page.posts.filter((post) => !knownIds.has(post.id))];
      });
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      setError(cause instanceof Error ? cause : new Error('Unable to load the public feed.'));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(null, true);
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || isLoading) return;
    await loadPage(cursor, false);
  }, [cursor, hasMore, isLoading, loadPage]);

  const reload = useCallback(async () => {
    await loadPage(null, true);
  }, [loadPage]);

  return { posts, isLoading, hasMore, error, loadMore, reload };
}

export default usePublicProfileFeed;
