/**
 * Subscription API Layer
 *
 * KCL Pro 멤버십 관련 Supabase 호출 함수들
 *
 * - Buy Me a Coffee 멤버십 URL 생성
 * - kcl_subscriptions 테이블 조회 (RLS: 본인 구독만)
 *
 * @see doc/project/kcl/화면기획/KCL-Pro-구독기획.md
 */

import { getSupabase } from '@/lib/supabase/client';
import { BMC_MEMBERSHIP_URL } from '@/lib/constants';

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
  /** 레거시 호환용 필드 (현재 미사용) */
  variantId?: number;
  /** 현재 locale (추적 파라미터에 사용) */
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
 * Buy Me a Coffee 멤버십 URL 생성
 */
function buildMembershipUrl(locale: string): string {
  const url = new URL(BMC_MEMBERSHIP_URL);

  if (!url.searchParams.has('utm_source')) {
    url.searchParams.set('utm_source', 'kcl-pro-page');
  }
  if (!url.searchParams.has('utm_medium')) {
    url.searchParams.set('utm_medium', 'membership');
  }
  if (!url.searchParams.has('utm_campaign')) {
    url.searchParams.set('utm_campaign', 'kcl-pro');
  }
  if (!url.searchParams.has('locale')) {
    url.searchParams.set('locale', locale);
  }

  return url.toString();
}

/**
 * Checkout URL 생성
 *
 * Buy Me a Coffee 멤버십 페이지 URL을 생성합니다.
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

    const checkoutUrl = buildMembershipUrl(params.locale || 'en');
    return { success: true, checkoutUrl };
  } catch (error) {
    console.error('[createCheckout] Error:', error);
    return { success: false, error: 'Failed to open membership page' };
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
      .in('status', ['active', 'on_trial', 'past_due'])
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
  const legacySubscriptionId = row.ls_subscription_id as string | undefined;
  const providerSubscriptionId = row.provider_subscription_id as string | undefined;
  const legacyCustomerId = row.ls_customer_id as string | undefined;
  const providerCustomerId = row.provider_customer_id as string | undefined;

  return {
    id: row.id as string,
    userId: row.user_id as string,
    lsSubscriptionId: legacySubscriptionId || providerSubscriptionId || '',
    lsCustomerId: legacyCustomerId || providerCustomerId || null,
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
