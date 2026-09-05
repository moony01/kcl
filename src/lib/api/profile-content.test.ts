import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PROFILE_CAPTION_MAX_LENGTH,
  PROFILE_FEED_PAGE_SIZE,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_VIDEO_MAX_BYTES,
  PROFILE_VIDEO_MAX_SECONDS,
  buildProfileFeedPath,
  validateProfileMediaFile,
} from './profile-content';

const fixtures = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    or: vi.fn(),
    in: vi.fn(),
    limit: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.in.mockResolvedValue({ data: [], error: null });
  query.limit.mockResolvedValue({ data: [], error: null });

  return {
    query,
    supabase: {
      from: vi.fn(() => query),
      storage: {
        from: vi.fn(() => ({
          getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.example.com/${path}` } })),
        })),
      },
    },
  };
});

vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => fixtures.supabase,
}));

function makeFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('public profile feed query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(['image', 'short'] as const)('filters published public posts by %s on the server', async (mediaType) => {
    const { listPublicProfilePosts } = await import('./profile-content');

    await listPublicProfilePosts({ mediaType });

    expect(fixtures.query.eq).toHaveBeenCalledWith('status', 'published');
    expect(fixtures.query.eq).toHaveBeenCalledWith('is_public', true);
    expect(fixtures.query.eq).toHaveBeenCalledWith('media_type', mediaType);
  });

  it('keeps the unfiltered query when mediaType is omitted', async () => {
    const { listPublicProfilePosts } = await import('./profile-content');

    await listPublicProfilePosts();

    expect(fixtures.query.eq).toHaveBeenCalledWith('status', 'published');
    expect(fixtures.query.eq).toHaveBeenCalledWith('is_public', true);
    expect(fixtures.query.eq).not.toHaveBeenCalledWith('media_type', expect.anything());
  });

  it('hydrates each public post with its user profile', async () => {
    const { listPublicProfilePosts } = await import('./profile-content');
    const post = {
      id: 'post-1',
      user_id: 'user-1',
      media_type: 'image',
      storage_path: 'user-1/post-1.png',
      caption: '연습생 연습 기록',
      created_at: '2026-08-30T00:00:00Z',
    };
    fixtures.query.limit.mockResolvedValueOnce({ data: [post], error: null });
    fixtures.query.in.mockResolvedValueOnce({
      data: [{ id: 'user-1', username: '벚꽃쿠라', avatar_url: 'https://avatar.example.com/user-1.png' }],
      error: null,
    });

    const page = await listPublicProfilePosts();

    expect(fixtures.query.select).toHaveBeenCalledWith('id, user_id, media_type, storage_path, caption, created_at');
    expect(fixtures.supabase.from).toHaveBeenCalledWith('user_profiles');
    expect(fixtures.query.in).toHaveBeenCalledWith('id', ['user-1']);
    expect(page.posts[0]?.author).toEqual({
      id: 'user-1',
      username: '벚꽃쿠라',
      avatar_url: 'https://avatar.example.com/user-1.png',
    });
  });
});

describe('profile content validation', () => {
  it('accepts supported image and video types within their limits', () => {
    expect(validateProfileMediaFile(makeFile('profile.webp', 'image/webp', PROFILE_IMAGE_MAX_BYTES))).toBeNull();
    expect(validateProfileMediaFile(makeFile('practice.mp4', 'video/mp4', PROFILE_VIDEO_MAX_BYTES))).toBeNull();
  });

  it('rejects unsupported types and oversized files', () => {
    expect(validateProfileMediaFile(makeFile('profile.gif', 'image/gif', 10))).toContain('JPG');
    expect(validateProfileMediaFile(makeFile('profile.png', 'image/png', PROFILE_IMAGE_MAX_BYTES + 1))).toContain('10MB');
    expect(validateProfileMediaFile(makeFile('practice.mp4', 'video/mp4', PROFILE_VIDEO_MAX_BYTES + 1))).toContain('50MB');
  });

  it('builds a user-scoped path with a safe extension', () => {
    const path = buildProfileFeedPath('user-id', makeFile('practice.MOV', 'video/quicktime', 1));
    expect(path).toMatch(/^user-id\/[0-9a-f-]+\.mov$/);

    const disguisedPath = buildProfileFeedPath('user-id', makeFile('payload.html', 'image/jpeg', 1));
    expect(disguisedPath).toMatch(/^user-id\/[0-9a-f-]+\.jpg$/);
  });

  it('keeps the agreed product limits explicit', () => {
    expect(PROFILE_FEED_PAGE_SIZE).toBe(4);
    expect(PROFILE_VIDEO_MAX_SECONDS).toBe(60);
    expect(PROFILE_CAPTION_MAX_LENGTH).toBe(240);
  });
});
