/**
 * KCL Pro 결제 성공 페이지
 *
 * Lemon Squeezy Checkout 완료 후 리다이렉트되는 페이지
 * Webhook 처리가 완료되기까지 약간의 지연이 있을 수 있음
 */

import { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import SuccessClient from './SuccessClient';
import { SUPPORTED_LOCALES } from '@/lib/constants';

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

interface SuccessPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Welcome to KCL Pro!',
  };
}

export default async function SuccessPage({ params }: SuccessPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SuccessClient />;
}
