import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { getVerifiedKpopfaceCheckout, KPOPFACE_REPORT_PACK } from '../_shared/kpopface-payment.ts';

type JsonObject = Record<string, unknown>;

function jsonResponse(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyStripeSignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const header = req.headers.get('stripe-signature') || '';
  const values = header.split(',').reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split('=', 2);
    if (key && value) acc[key] = [...(acc[key] || []), value];
    return acc;
  }, {});

  const timestamp = Number(values.t?.[0]);
  const signatures = values.v1 || [];
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > 5 * 60) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((signature) => constantTimeEqual(signature, expected));
}

function isPaidCheckoutEvent(type: string): boolean {
  return type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded';
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !webhookSecret) {
    return jsonResponse({ error: 'Server configuration unavailable' }, 500);
  }

  const rawBody = await req.text();
  if (!(await verifyStripeSignature(req, rawBody, webhookSecret))) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 401);
  }

  let event: JsonObject;
  try {
    event = JSON.parse(rawBody) as JsonObject;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  if (!isPaidCheckoutEvent(String(event.type || ''))) {
    return jsonResponse({ ok: true, ignored: true });
  }

  const eventData = event.data && typeof event.data === 'object' && !Array.isArray(event.data)
    ? event.data as JsonObject
    : null;
  const session = eventData?.object && typeof eventData.object === 'object' && !Array.isArray(eventData.object)
    ? eventData.object as JsonObject
    : null;
  const sessionId = typeof session?.id === 'string' ? session.id : null;
  const verifiedCheckout = getVerifiedKpopfaceCheckout(session);
  if (!sessionId || !verifiedCheckout) {
    // This can be an unpaid delayed-payment event or a signed event for a
    // different Checkout product. Do not credit it, but acknowledge it so
    // Stripe does not retry a permanently ineligible event.
    return jsonResponse({ ok: true, ignored: true });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: payment, error: paymentLookupError } = await supabase
    .from('kpopface_payments')
    .select('id, user_id, product, quantity, amount_cents, currency')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle();

  if (paymentLookupError) {
    console.error('[kpopface-stripe-webhook] payment lookup failed:', paymentLookupError.message);
    return jsonResponse({ error: 'Payment lookup failed' }, 500);
  }

  if (
    !payment ||
    payment.user_id !== verifiedCheckout.userId ||
    payment.product !== KPOPFACE_REPORT_PACK.product ||
    payment.quantity !== verifiedCheckout.quantity ||
    payment.amount_cents !== KPOPFACE_REPORT_PACK.amountCents ||
    payment.currency !== KPOPFACE_REPORT_PACK.currency
  ) {
    console.warn('[kpopface-stripe-webhook] checkout did not match a pending KCL payment');
    return jsonResponse({ ok: true, ignored: true });
  }

  const { data: updatedPayment, error: paymentUpdateError } = await supabase
    .from('kpopface_payments')
    .update({
      stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', sessionId)
    .select('id')
    .maybeSingle();

  if (paymentUpdateError || !updatedPayment) {
    console.error('[kpopface-stripe-webhook] payment update failed:', paymentUpdateError?.message);
    return jsonResponse({ error: 'Payment record update failed' }, 500);
  }

  const { data: grant, error: grantError } = await supabase.rpc('kpopface_grant_paid_credits', {
    p_user_id: verifiedCheckout.userId,
    p_quantity: verifiedCheckout.quantity,
    p_reference: `stripe_checkout:${sessionId}`,
  });

  if (grantError || !grant?.ok) {
    console.error('[kpopface-stripe-webhook] credit grant failed:', grantError?.message || grant?.error_code);
    return jsonResponse({ error: 'Credit grant failed' }, 500);
  }

  return jsonResponse({ ok: true, session_id: sessionId, already_granted: grant.already_granted === true });
});
