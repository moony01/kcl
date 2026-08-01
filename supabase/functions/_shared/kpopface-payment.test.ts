import { describe, expect, it } from 'vitest';
import { getVerifiedKpopfaceCheckout, KPOPFACE_REPORT_PACK } from './kpopface-payment';

function matchingSession() {
  return {
    mode: 'payment',
    payment_status: 'paid',
    currency: KPOPFACE_REPORT_PACK.currency,
    amount_total: KPOPFACE_REPORT_PACK.amountCents,
    client_reference_id: 'user-123',
    metadata: {
      user_id: 'user-123',
      product: KPOPFACE_REPORT_PACK.product,
      quantity: String(KPOPFACE_REPORT_PACK.quantity),
    },
  };
}

describe('getVerifiedKpopfaceCheckout', () => {
  it('accepts the paid five-report pack created by KCL', () => {
    expect(getVerifiedKpopfaceCheckout(matchingSession())).toEqual({
      userId: 'user-123',
      quantity: 5,
    });
  });

  it('rejects a Checkout Session before payment succeeds', () => {
    expect(getVerifiedKpopfaceCheckout({ ...matchingSession(), payment_status: 'unpaid' })).toBeNull();
  });

  it('rejects a session with a different price or currency', () => {
    expect(getVerifiedKpopfaceCheckout({ ...matchingSession(), amount_total: 1 })).toBeNull();
    expect(getVerifiedKpopfaceCheckout({ ...matchingSession(), currency: 'krw' })).toBeNull();
  });

  it('rejects a session whose product metadata or purchaser does not match', () => {
    expect(getVerifiedKpopfaceCheckout({
      ...matchingSession(),
      metadata: { ...matchingSession().metadata, product: 'other_product' },
    })).toBeNull();
    expect(getVerifiedKpopfaceCheckout({ ...matchingSession(), client_reference_id: 'other-user' })).toBeNull();
  });
});
