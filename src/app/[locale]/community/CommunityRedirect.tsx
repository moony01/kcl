'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CommunityRedirectProps {
  locale: string;
}

/**
 * 커뮤니티 → 공지사항 클라이언트 리다이렉트 컴포넌트
 * SSG 환경에서 router.replace 사용 + meta refresh 폴백
 */
export default function CommunityRedirect({ locale }: CommunityRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/notice`);
  }, [locale, router]);

  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=/${locale}/notice`} />
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p>Redirecting to notices...</p>
      </div>
    </>
  );
}
