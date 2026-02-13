/**
 * 브라우저 고유 식별자(Fingerprint) 유틸리티
 * localStorage에 UUID를 저장하여 비로그인 환경에서 사용자를 식별
 * 좋아요 중복 방지 등에 활용
 */

/** localStorage 키 */
const FINGERPRINT_KEY = 'kcl_fingerprint';

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

  const existing = localStorage.getItem(FINGERPRINT_KEY);
  if (existing) {
    return existing;
  }

  const uuid = crypto.randomUUID();
  localStorage.setItem(FINGERPRINT_KEY, uuid);
  return uuid;
}
