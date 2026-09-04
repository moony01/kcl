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
  return DOMPurify.sanitize(content);
}
