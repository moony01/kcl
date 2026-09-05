import { describe, expect, it } from 'vitest';
import {
  normalizeProfilePostSocial,
  PROFILE_POST_COMMENT_MAX_LENGTH,
  validateProfilePostCommentContent,
} from './profile-social';

describe('profile post social API helpers', () => {
  it('trims and validates comments at the product limit', () => {
    expect(validateProfilePostCommentContent('  좋아요  ')).toBe('좋아요');
    expect(() => validateProfilePostCommentContent(' '.repeat(2))).toThrow();
    expect(() => validateProfilePostCommentContent('a'.repeat(PROFILE_POST_COMMENT_MAX_LENGTH + 1))).toThrow();
  });

  it('returns a stable zero-filled shape for a batch of post ids', () => {
    expect(normalizeProfilePostSocial([
      { post_id: 'post-1', likes_count: 2, comments_count: 1, liked_by_viewer: true },
    ], ['post-1', 'post-2'])).toEqual([
      { post_id: 'post-1', likes_count: 2, comments_count: 1, liked_by_viewer: true },
      { post_id: 'post-2', likes_count: 0, comments_count: 0, liked_by_viewer: false },
    ]);
  });
});
