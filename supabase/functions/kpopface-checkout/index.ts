import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonObject = Record<string, unknown>;

const PACK_PRICE_CENTS = 499;
const PACK_QUANTITY = 5;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowedOrigins = new Set([
    'https://kclhq.com',
    'https://www.kclhq.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);

  return {
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    Vary: 'Origin',
  };
}

function jsonResponse(req: Request, body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
  });
}

function normalizeLocale(value: unknown): 'ko' | 'en' {
  return value === 'ko' ? 'ko' : 'en';
}

async function getUser(req: Request, supabase: SupabaseClient): Promise<string | null> {
  const authorization = req.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

async function createCheckoutSession(params: {
  stripeSecretKey: string;
  userId: string;
  locale: 'ko' | 'en';
  publicUrl: string;
}): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams();
  body.set('mode', 'payment');
  body.set('success_url', `${params.publicUrl}/${params.locale}/kpopface/report?checkout=success`);
  body.set('cancel_url', `${params.publicUrl}/${params.locale}/kpopface/report?checkout=cancelled`);
  body.set('client_reference_id', params.userId);
  body.set('metadata[user_id]', params.userId);
  body.set('metadata[product]', 'kpopface_report_pack_5');
  body.set('metadata[quantity]', String(PACK_QUANTITY));
  body.set('line_items[0][quantity]', '1');
  body.set('line_items[0][price_data][currency]', 'usd');
  body.set('line_items[0][price_data][unit_amount]', String(PACK_PRICE_CENTS));
  body.set('line_items[0][price_data][product_data][name]', 'KCL AI Report Pack (5 reports)');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await response.json() as JsonObject;
  if (!response.ok || typeof payload.id !== 'string' || typeof payload.url !== 'string') {
    console.error('[kpopface-checkout] Stripe session creation failed:', response.status, payload?.error);
    throw new Error('STRIPE_CHECKOUT_FAILED');
  }

  return { id: payload.id, url: payload.url };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const publicUrl = (Deno.env.get('KCL_PUBLIC_URL') || 'https://www.kclhq.com').replace(/\/$/, '');

  if (!supabaseUrl || !serviceRoleKey || !stripeSecretKey) {
    return jsonResponse(req, { error: 'Server configuration unavailable' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const userId = await getUser(req, supabase);
  if (!userId) {
    return jsonResponse(req, { error: 'Authentication required' }, 401);
  }

  let input: JsonObject;
  try {
    input = await req.json() as JsonObject;
  } catch {
    input = {};
  }

  const locale = normalizeLocale(input.locale);

  try {
    const session = await createCheckoutSession({
      stripeSecretKey,
      userId,
      locale,
      publicUrl,
    });

    const { error: paymentInsertError } = await supabase.from('kpopface_payments').insert({
      user_id: userId,
      stripe_checkout_session_id: session.id,
      product: 'kpopface_report_pack_5',
      quantity: PACK_QUANTITY,
      amount_cents: PACK_PRICE_CENTS,
      currency: 'usd',
      status: 'pending',
    });

    if (paymentInsertError && paymentInsertError.code !== '23505') {
      console.error('[kpopface-checkout] payment record failed:', paymentInsertError.message);
      return jsonResponse(req, { error: 'Could not save checkout state' }, 500);
    }

    return jsonResponse(req, { ok: true, url: session.url });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : 'STRIPE_CHECKOUT_FAILED';
    return jsonResponse(req, { error: 'Checkout could not be started', error_code: errorCode }, 502);
  }
});
