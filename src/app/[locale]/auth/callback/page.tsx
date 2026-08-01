/**
 * OAuth 콜백 페이지 (Server Component 셸)
 *
 * 공개 콜백 셸은 언어별로 생성할 수 있지만, 실제 code 교환은
 * CallbackClient에서 수행하고 쿠키 세션은 SSR 미들웨어와 공유합니다.
 */

import { SUPPORTED_LOCALES } from '@/lib/constants';
import CallbackClient from './CallbackClient';

/** 지원 언어별 콜백 셸 생성 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export default function AuthCallbackPage() {
  return <CallbackClient />;
}
