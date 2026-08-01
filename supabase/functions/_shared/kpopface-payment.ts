export const KPOPFACE_REPORT_PACK = {
  product: 'kpopface_report_pack_5',
  quantity: 5,
  amountCents: 499,
  currency: 'usd',
} as const;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export interface VerifiedKpopfaceCheckout {
  userId: string;
  quantity: number;
}

/**
 * Accept only the Checkout Session shape created by kpopface-checkout.
 * This keeps a signed, but unrelated Stripe event from granting report credits.
 */
export function getVerifiedKpopfaceCheckout(session: unknown): VerifiedKpopfaceCheckout | null {
  if (!isRecord(session) || !isRecord(session.metadata)) return null;

  const metadata = session.metadata;
  const userId = metadata.user_id;
  if (typeof userId !== 'string' || userId.length === 0) return null;

  if (
    session.mode !== 'payment' ||
    session.payment_status !== 'paid' ||
    session.currency !== KPOPFACE_REPORT_PACK.currency ||
    session.amount_total !== KPOPFACE_REPORT_PACK.amountCents ||
    session.client_reference_id !== userId ||
    metadata.product !== KPOPFACE_REPORT_PACK.product ||
    metadata.quantity !== String(KPOPFACE_REPORT_PACK.quantity)
  ) {
    return null;
  }

  return { userId, quantity: KPOPFACE_REPORT_PACK.quantity };
}
