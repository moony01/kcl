/**
 * SWRProvider
 *
 * SWR 전역 설정 Provider
 * 개발 모드에서 불필요한 API 호출을 방지합니다.
 */

'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

const isDev = process.env.NODE_ENV === 'development';

interface SWRProviderProps {
  children: ReactNode;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // 개발 모드에서 중복 호출 방지
        revalidateOnFocus: !isDev,
        revalidateOnReconnect: !isDev,
        revalidateIfStale: !isDev, // 개발 모드: stale 데이터 재검증 비활성화
        dedupingInterval: isDev ? 60000 : 5000, // 개발: 60초, 프로덕션: 5초
        // 에러 시 재시도 설정
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // 포커스 시 재검증 간격 (개발 모드에서 더 길게)
        focusThrottleInterval: isDev ? 60000 : 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}

export default SWRProvider;
