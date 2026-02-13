/**
 * OAuth 콜백 페이지 (Server Component 셸)
 *
 * 정적 빌드(output: 'export') 호환을 위해
 * generateStaticParams()로 12개 언어 경로를 사전 생성합니다.
 * 실제 콜백 처리는 CallbackClient 클라이언트 컴포넌트에서 수행합니다.
 */

import { SUPPORTED_LOCALES } from '@/lib/constants';
import CallbackClient from './CallbackClient';

/** 12개 언어에 대한 정적 페이지 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
