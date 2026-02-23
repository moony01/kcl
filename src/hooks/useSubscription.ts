/**
 * useSubscription Hook
 *
 * KCL Pro 구독 상태 관리 훅
 *
 * - 로그인 사용자의 활성 구독 정보를 조회
 * - Checkout 생성 (Lemon Squeezy 결제 플로우 시작)
 * - 구독 상태 (isPro, status, renewsAt 등) 제공
 *
 * @example
 * ```tsx
 * const { isPro, subscription, createCheckoutUrl, isLoading } = useSubscription();
 *
 * if (isPro) {
 *   // Pro 사용자 UI
 * } else {
 *   // 업그레이드 유도 UI
 * }
 * ```
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import {
  getActiveSubscription,
  createCheckout,
  type Subscription,
  type CreateCheckoutParams,
} from '@/lib/api/subscription';

/** useSubscription 훅 반환 타입 */
export interface UseSubscriptionReturn {
  /** Pro 구독 활성 여부 */
  isPro: boolean;
  /** 활성 구독 정보 (없으면 null) */
  subscription: Subscription | null;
  /** 구독 상태 */
  status: string | null;
  /** 다음 갱신일 */
  renewsAt: string | null;
  /** 구독 종료일 (해지 예정) */
  endsAt: string | null;
  /** 결제수단 변경 URL */
  updatePaymentMethodUrl: string | null;
  /** 고객 포털 URL (해지 등) */
  customerPortalUrl: string | null;
  /** Checkout URL 생성 (결제 시작) */
  createCheckoutUrl: (params?: CreateCheckoutParams) => Promise<string | null>;
  /** 구독 정보 새로고침 */
  refetch: () => Promise<void>;
  /** 로딩 상태 */
  isLoading: boolean;
  /** Checkout 생성 로딩 */
  isCheckoutLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
}

/**
 * KCL Pro 구독 상태 관리 훅
 */
export function useSubscription(): UseSubscriptionReturn {
  const { profile, isAuthenticated } = useAuth();
  const locale = useLocale();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 활성 구독 조회
   */
  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const sub = await getActiveSubscription();
      setSubscription(sub);
      setError(null);
    } catch (err) {
      console.error('[useSubscription] Fetch error:', err);
      setError('Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  /**
   * 로그인 상태 변경 시 구독 조회
   */
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Checkout URL 생성 (Lemon Squeezy 결제 플로우 시작)
   *
   * @returns Checkout URL 또는 null (실패 시)
   */
  const createCheckoutUrl = useCallback(
    async (params: CreateCheckoutParams = {}): Promise<string | null> => {
      if (!isAuthenticated) {
        setError('Login required');
        return null;
      }

      try {
        setIsCheckoutLoading(true);
        setError(null);
        // locale을 전달하여 결제 후 redirect URL에 사용
        const result = await createCheckout({ ...params, locale });

        if (!result.success || !result.checkoutUrl) {
          setError(result.error || 'Failed to create checkout');
          return null;
        }

        return result.checkoutUrl;
      } catch (err) {
        console.error('[useSubscription] Checkout error:', err);
        setError('Failed to create checkout');
        return null;
      } finally {
        setIsCheckoutLoading(false);
      }
    },
    [isAuthenticated, locale],
  );

  /**
   * Pro 상태 판별
   * 1순위: 구독 조회 결과 (subscription?.status)
   * 2순위: 프로필의 is_pro 필드 (캐시)
   */
  const isPro = useMemo(() => {
    if (subscription) {
      return ['active', 'on_trial'].includes(subscription.status);
    }
    // 프로필의 is_pro를 fallback으로 사용
    return !!profile?.is_pro;
  }, [subscription, profile]);

  return {
    isPro,
    subscription,
    status: subscription?.status || null,
    renewsAt: subscription?.renewsAt || null,
    endsAt: subscription?.endsAt || null,
    updatePaymentMethodUrl: subscription?.updatePaymentMethodUrl || null,
    customerPortalUrl: subscription?.customerPortalUrl || null,
    createCheckoutUrl,
    refetch: fetchSubscription,
    isLoading,
    isCheckoutLoading,
    error,
  };
}

export default useSubscription;
