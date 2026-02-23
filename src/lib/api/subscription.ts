/**
 * Subscription API Layer
 *
 * KCL Pro 구독 관련 Supabase 및 Edge Function 호출 함수들
 *
 * - create-checkout Edge Function 호출 → Lemon Squeezy Checkout URL 생성
 * - kcl_subscriptions 테이블 조회 (RLS: 본인 구독만)
 *
 * @see doc/project/kcl/화면기획/KCL-Pro-구독기획.md
 */

import { getSupabase } from '@/lib/supabase/client';

/** 구독 상태 타입 */
export type SubscriptionStatus =
  | 'active'
  | 'on_trial'
  | 'paused'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'unpaid';

/** 구독 정보 인터페이스 */
export interface Subscription {
  id: string;
  userId: string;
  lsSubscriptionId: string;
  lsCustomerId: string | null;
  orderId: string | null;
  planId: number | null;
  status: SubscriptionStatus;
  renewsAt: string | null;
  endsAt: string | null;
  trialEndsAt: string | null;
  updatePaymentMethodUrl: string | null;
  customerPortalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Checkout 생성 요청 파라미터 */
export interface CreateCheckoutParams {
  /** Variant ID (기본값: Monthly) */
  variantId?: number;
  /** 현재 locale (redirect URL에 사용) */
  locale?: string;
}

/** Checkout 생성 결과 */
export interface CreateCheckoutResult {
  /** 성공 여부 */
  success: boolean;
  /** Checkout URL (성공 시) */
  checkoutUrl?: string;
  /** 에러 메시지 (실패 시) */
  error?: string;
}

/**
 * Supabase Edge Function URL 생성 헬퍼
 */
function getEdgeFunctionUrl(functionName: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/${functionName}`;
}

/**
 * Checkout URL 생성
 *
 * create-checkout Edge Function을 호출하여 Lemon Squeezy Checkout URL을 생성합니다.
 * 인증된 사용자만 호출 가능 (JWT 검증).
 *
 * @param params - Checkout 파라미터
 * @returns Checkout URL 또는 에러
 */
export async function createCheckout(
  params: CreateCheckoutParams = {},
): Promise<CreateCheckoutResult> {
  const supabase = getSupabase();

  try {
    // 현재 세션의 JWT 토큰 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await fetch(getEdgeFunctionUrl('create-checkout'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        variant_id: params.variantId,
        locale: params.locale || 'en',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create checkout' };
    }

    return { success: true, checkoutUrl: data.checkout_url };
  } catch (error) {
    console.error('[createCheckout] Error:', error);
    return { success: false, error: 'Failed to create checkout' };
  }
}

/**
 * 현재 사용자의 활성 구독 조회
 *
 * RLS 정책에 의해 본인의 구독만 조회됩니다.
 *
 * @returns 활성 구독 정보 또는 null
 */
export async function getActiveSubscription(): Promise<Subscription | null> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('kcl_subscriptions')
      .select('*')
      .in('status', ['active', 'on_trial'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[getActiveSubscription] Error:', error.message);
      return null;
    }

    if (!data) return null;

    return mapSubscription(data);
  } catch (error) {
    console.error('[getActiveSubscription] Unexpected error:', error);
    return null;
  }
}

/**
 * 현재 사용자의 모든 구독 이력 조회
 *
 * @returns 구독 이력 배열
 */
export async function getSubscriptionHistory(): Promise<Subscription[]> {
  const supabase = getSupabase();

  try {
    const { data, error } = await supabase
      .from('kcl_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getSubscriptionHistory] Error:', error.message);
      return [];
    }

    return (data || []).map(mapSubscription);
  } catch (error) {
    console.error('[getSubscriptionHistory] Unexpected error:', error);
    return [];
  }
}

/**
 * DB 레코드 → Subscription 인터페이스 매핑
 */
function mapSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    lsSubscriptionId: row.ls_subscription_id as string,
    lsCustomerId: (row.ls_customer_id as string) || null,
    orderId: (row.order_id as string) || null,
    planId: (row.plan_id as number) || null,
    status: row.status as SubscriptionStatus,
    renewsAt: (row.renews_at as string) || null,
    endsAt: (row.ends_at as string) || null,
    trialEndsAt: (row.trial_ends_at as string) || null,
    updatePaymentMethodUrl: (row.update_payment_method_url as string) || null,
    customerPortalUrl: (row.customer_portal_url as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
