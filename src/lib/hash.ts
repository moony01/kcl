/**
 * hash.ts
 *
 * 해싱 유틸리티 함수
 * IP 주소 등 민감한 정보를 해싱하여 저장합니다.
 */

/**
 * IP 해싱용 Salt (환경변수에서 가져오거나 기본값 사용)
 * 보안을 위해 프로덕션에서는 반드시 환경변수로 설정해야 합니다.
 */
const IP_HASH_SALT = process.env.IP_HASH_SALT || 'kcl-default-salt-2024';

/**
 * IP 주소를 SHA-256으로 해싱
 *
 * 개인정보 보호를 위해 원본 IP 대신 해시값을 저장합니다.
 * Salt를 추가하여 레인보우 테이블 공격을 방지합니다.
 *
 * @param ip 원본 IP 주소
 * @returns 32자 해시 문자열
 *
 * @example
 * hashIp('192.168.1.1') // 'a1b2c3d4e5f6...'
 */
export async function hashIp(ip: string): Promise<string> {
  const salt = process.env.IP_HASH_SALT || 'kcl-default-salt-2024';
  const data = new TextEncoder().encode(ip + salt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}
