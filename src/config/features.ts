/**
 * Feature Flags 설정
 *
 * KCL 앱의 기능 ON/OFF 제어
 * Phase별로 기능을 점진적으로 활성화할 때 사용합니다.
 *
 * @usage
 * ```tsx
 * import { FEATURES } from '@/config/features';
 *
 * if (FEATURES.ANALYTICS_PAGE) {
 *   // 통계 페이지 관련 코드
 * }
 * ```
 *
 * @updated 2026-01-19 - Phase 1: Analytics, Company Detail 비활성화
 */

export const FEATURES = {
  /**
   * 통계 페이지 (Analytics)
   * - 경로: /[locale]/analytics
   * - 상태: Phase 2에서 활성화 예정
   */
  ANALYTICS_PAGE: false,

  /**
   * 회사 상세보기 페이지 (Company Detail)
   * - 경로: /[locale]/company/[id]
   * - 상태: Phase 2에서 활성화 예정
   */
  COMPANY_DETAIL_PAGE: false,

  /**
   * 명예의 전당 (Hall of Fame)
   * - 경로: /[locale]/hall-of-fame
   * - 상태: Phase 1에서 활성화
   */
  HALL_OF_FAME_PAGE: true,

  /**
   * 뉴스 페이지 (News)
   * - 경로: /[locale]/news
   * - 상태: Phase 1에서 활성화
   */
  NEWS_PAGE: true,

  /**
   * 커뮤니티 (Community)
   * - 경로: /[locale]/community
   * - 상태: Phase 1에서 활성화
   */
  COMMUNITY_PAGE: false,

  /**
   * 공지사항 (Notice)
   * - 경로: /[locale]/notice
   * - 상태: 커뮤니티를 대체하여 활성화
   */
  NOTICE_PAGE: true,

  /**
   * 프로필/로그인 (Profile/Auth)
   * - 경로: /[locale]/profile, /[locale]/login
   * - 상태: T1.70에서 활성화 (Google/Kakao OAuth + 이메일 로그인)
   */
  AUTH_SYSTEM: true,

  /**
   * T1.75: 산하 레이블 투표 UI (Sub-Label Voting)
   * - HYBE(6개 산하), YG(1개 산하) 투표 시 서브레이블 필터 표시
   * - 투표는 항상 부모 소속사에 귀속, 서브레이블은 UI 필터 역할만
   */
  SUB_LABEL_VOTING: true,
} as const;

/** Feature Flag 타입 */
export type FeatureKey = keyof typeof FEATURES;

/**
 * 특정 기능이 활성화되어 있는지 확인
 * @param feature 기능 키
 * @returns 활성화 여부
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
