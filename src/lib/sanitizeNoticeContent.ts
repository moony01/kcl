/**
 * Sanitize notice HTML only in the browser.
 *
 * The server/Workers bundle must not evaluate isomorphic-dompurify because
 * its Node entry imports jsdom. The notice is withheld until this browser-only
 * sanitizer resolves, so unsanitized HTML is never rendered.
 */
export async function sanitizeNoticeContent(content: string): Promise<string> {
  if (typeof window === 'undefined') return '';

  const { default: DOMPurify } = await import('isomorphic-dompurify');
  return DOMPurify.sanitize(content, {
    USE_PROFILES: { html: true },
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: [
      'base',
      'embed',
      'form',
      'iframe',
      'input',
      'object',
      'script',
      'style',
      'textarea',
    ],
    FORBID_ATTR: ['action', 'formaction', 'onerror', 'onload', 'style'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
