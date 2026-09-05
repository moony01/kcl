/**
 * 브라우저 측 고유 식별자 생성기
 *
 * Web Crypto가 제공하는 UUID/난수 API를 우선 사용합니다. 마지막 fallback은
 * 구형/제한된 런타임에서의 충돌 완화용일 뿐이며 인증·권한·rate limit 증명에
 * 사용해서는 안 됩니다.
 */

let fallbackSequence = 0;

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createClientIdentifier(): string {
  const browserCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (typeof browserCrypto?.randomUUID === 'function') {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    browserCrypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return formatUuid(bytes);
  }

  fallbackSequence = (fallbackSequence + 1) & 0xffff;
  const timestamp = Date.now().toString(16).padStart(8, '0').slice(-8);
  const sequence = fallbackSequence.toString(16).padStart(4, '0');
  return `00000000-0000-4000-8000-${timestamp}${sequence}`;
}
