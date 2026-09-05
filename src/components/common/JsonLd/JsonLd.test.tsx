import { describe, expect, it } from 'vitest';
import { serializeJsonLd } from './index';

describe('serializeJsonLd', () => {
  it('escapes HTML-sensitive characters before embedding JSON in a script tag', () => {
    const serialized = serializeJsonLd({ headline: '</script><script>alert(1)</script>' });

    expect(serialized).not.toContain('</script>');
    expect(serialized).toContain('\\u003c/script\\u003e');
  });
});
