/**
 * 브라우저 고유 식별자(Fingerprint) 유틸리티
 * localStorage에 UUID를 저장하여 비로그인 환경에서 사용자를 식별
 * 좋아요 중복 방지 등에 활용
 */

/** localStorage 키 */
const FINGERPRINT_KEY = 'kcl_fingerprint';

function createFingerprint(): string {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === 'function') {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues === 'function') {
    const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 브라우저 fingerprint(UUID) 조회 또는 생성
 * - localStorage에 이미 저장된 값이 있으면 반환
 * - 없으면 새 UUID를 생성하여 저장 후 반환
 * @returns UUID 문자열
 */
export function getFingerprint(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const existing = localStorage.getItem(FINGERPRINT_KEY);
    if (existing) {
      return existing;
    }

    const uuid = createFingerprint();
    localStorage.setItem(FINGERPRINT_KEY, uuid);
    return uuid;
  } catch {
    return createFingerprint();
  }
}
