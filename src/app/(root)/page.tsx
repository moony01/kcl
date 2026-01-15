"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 기본 언어(ko)로 리다이렉트
    router.replace('/ko');
  }, [router]);

  return null;
}
