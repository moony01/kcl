import { describe, expect, it } from 'vitest';
import {
  PROFILE_CAPTION_MAX_LENGTH,
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_VIDEO_MAX_BYTES,
  PROFILE_VIDEO_MAX_SECONDS,
  buildProfileFeedPath,
  validateProfileMediaFile,
} from './profile-content';

function makeFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

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
  });

  it('keeps the agreed product limits explicit', () => {
    expect(PROFILE_VIDEO_MAX_SECONDS).toBe(60);
    expect(PROFILE_CAPTION_MAX_LENGTH).toBe(240);
  });
});
