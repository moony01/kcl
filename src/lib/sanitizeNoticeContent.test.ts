import { describe, expect, it } from 'vitest';
import { sanitizeNoticeContent } from './sanitizeNoticeContent';

describe('sanitizeNoticeContent', () => {
  it('removes executable markup while retaining safe notice HTML', async () => {
    const sanitized = await sanitizeNoticeContent(
      '<p>Safe notice</p><script>alert(1)</script><a href="javascript:alert(1)">link</a>',
    );

    expect(sanitized).toContain('<p>Safe notice</p>');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('javascript:');
  });
});
