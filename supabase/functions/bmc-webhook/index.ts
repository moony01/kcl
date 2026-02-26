import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type JsonObject = Record<string, unknown>;
type MembershipAction = 'active' | 'grace' | 'cancelled' | 'ignored';

const GRACE_DAYS = 10;

function jsonResponse(body: JsonObject, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getValueByPath(obj: JsonObject, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as JsonObject)[key];
  }

  return current;
}

function firstString(obj: JsonObject, paths: string[]): string | null {
  for (const path of paths) {
    const value = getValueByPath(obj, path);
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return null;
}

function findFirstStringByKeys(
  value: unknown,
  keys: Set<string>,
  depth = 0,
): string | null {
  if (depth > 5 || !value || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstStringByKeys(item, keys, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const obj = value as JsonObject;
  for (const [key, nested] of Object.entries(obj)) {
    if (keys.has(key.toLowerCase()) && typeof nested === 'string' && nested.trim()) {
      return nested.trim();
    }
  }

  for (const nested of Object.values(obj)) {
    const found = findFirstStringByKeys(nested, keys, depth + 1);
    if (found) return found;
  }

  return null;
}

function normalizeEventName(eventName: string): string {
  return eventName
    .trim()
    .toLowerCase()
    .replace(/[\s.-]+/g, '_');
}

function classifyMembershipAction(eventName: string, payload: JsonObject): MembershipAction {
  const normalizedEvent = normalizeEventName(eventName);
  const statusHint = (firstString(payload, [
    'status',
    'membership.status',
    'subscription.status',
    'membership_status',
    'subscription_status',
    'data.status',
    'data.membership.status',
  ]) || '').toLowerCase();

  const membershipSignal =
    normalizedEvent.includes('membership') ||
    !!firstString(payload, ['membership_id', 'membership_level_id', 'data.membership_level_id']);

  if (!membershipSignal) {
    return 'ignored';
  }

  const cancelAtPeriodEnd =
    (firstString(payload, ['cancel_at_period_end', 'data.cancel_at_period_end']) || '').toLowerCase() === 'true';

  const isCancelled =
    /(cancel|canceled|cancelled|expired|ended|deleted)/.test(normalizedEvent) ||
    ['cancelled', 'canceled', 'expired', 'unpaid'].includes(statusHint) ||
    cancelAtPeriodEnd;
  if (isCancelled) {
    return 'cancelled';
  }

  const isGrace =
    /(payment_failed|failed_payment|past_due|payment_issue)/.test(normalizedEvent) ||
    ['past_due'].includes(statusHint);
  if (isGrace) {
    return 'grace';
  }

  const isActive =
    /(created|started|renewed|resumed|reactivated|updated)/.test(normalizedEvent) ||
    ['active', 'on_trial', 'trialing'].includes(statusHint);
  if (isActive) {
    return 'active';
  }

  return 'ignored';
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function normalizeSignature(signature: string): string {
  const trimmed = signature.trim().replace(/^sha256=/i, '');
  return trimmed.toLowerCase();
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function verifySignature(req: Request, rawBody: string, secret: string): Promise<boolean> {
  const signatureHeader =
    req.headers.get('x-signature-sha256') || req.headers.get('x-bmc-signature') || '';

  if (!signatureHeader) {
    return false;
  }

  const received = normalizeSignature(signatureHeader);
  const expected = await hmacSha256Hex(secret, rawBody);
  return constantTimeEqual(received, expected);
}

async function upsertSubscriptionRow(params: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  email: string;
  membershipId: string;
  customerId: string | null;
  planId: number | null;
  status: string;
  renewsAt: string | null;
  endsAt: string | null;
  nowIso: string;
}): Promise<void> {
  const {
    supabase,
    userId,
    email,
    membershipId,
    customerId,
    planId,
    status,
    renewsAt,
    endsAt,
    nowIso,
  } = params;

  const row = {
    user_id: userId,
    ls_subscription_id: membershipId,
    ls_customer_id: customerId || email,
    plan_id: planId,
    status,
    renews_at: renewsAt,
    ends_at: endsAt,
    updated_at: nowIso,
  };

  const { data: existing } = await supabase
    .from('kcl_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from('kcl_subscriptions').update(row).eq('id', existing.id);
    return;
  }

  await supabase.from('kcl_subscriptions').insert({
    ...row,
    created_at: nowIso,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('BMC_WEBHOOK_SECRET');

  if (!supabaseUrl || !supabaseServiceRoleKey || !webhookSecret) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  const rawBody = await req.text();
  const isSignatureValid = await verifySignature(req, rawBody, webhookSecret);
  if (!isSignatureValid) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 401);
  }

  let payload: JsonObject;
  try {
    payload = JSON.parse(rawBody) as JsonObject;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const eventName =
    req.headers.get('x-bmc-event') ||
    firstString(payload, ['event', 'type', 'event_name']) ||
    'unknown';
  const normalizedEventName = normalizeEventName(eventName);

  const action = classifyMembershipAction(normalizedEventName, payload);
  if (action === 'ignored') {
    return jsonResponse({ ok: true, ignored: true, reason: 'non-membership event' });
  }

  const email = (
    firstString(payload, [
      'supporter_email',
      'email',
      'data.supporter_email',
      'data.email',
      'supporter.email',
      'data.supporter.email',
      'membership.subscriber_email',
      'data.membership.subscriber_email',
      'payer_email',
    ]) ||
    findFirstStringByKeys(payload, new Set(['supporter_email', 'email', 'member_email', 'subscriber_email', 'payer_email'])) ||
    ''
  ).trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return jsonResponse({ ok: true, ignored: true, reason: 'no email in webhook payload' });
  }

  const membershipId =
    firstString(payload, [
      'membership_id',
      'subscription_id',
      'membership.id',
      'data.membership_id',
      'data.subscription_id',
      'data.id',
      'id',
    ]) || `bmc:${email}`;

  const customerId = firstString(payload, [
    'supporter_id',
    'customer_id',
    'data.supporter_id',
    'supporter.id',
  ]);

  const planIdRaw = firstString(payload, [
    'membership_level_id',
    'data.membership_level_id',
    'membership.membership_level_id',
  ]);
  const planId = planIdRaw && /^\d+$/.test(planIdRaw) ? Number(planIdRaw) : null;

  const renewsAt = firstString(payload, [
    'next_billing_date',
    'renews_at',
    'next_renewal_at',
    'data.next_billing_date',
    'membership.renews_at',
  ]);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: linkedUserId, error: linkedLookupError } = await supabase.rpc(
    'kcl_find_user_id_by_bmc_email',
    {
      p_bmc_email: email,
    },
  );

  // linkedLookupError는 RPC 미존재 등 인프라 에러 — fallback으로 계속 진행
  if (linkedLookupError) {
    console.warn('kcl_find_user_id_by_bmc_email RPC error (fallback to email lookup):', linkedLookupError.message);
  }

  let resolvedUserId: string | null =
    linkedUserId && typeof linkedUserId === 'string' ? linkedUserId : null;

  if (!resolvedUserId) {
    const { data: userId, error: lookupError } = await supabase.rpc('kcl_find_user_id_by_email', {
      p_email: email,
    });

    if (lookupError) {
      return jsonResponse({ error: 'Failed to resolve user by email' }, 500);
    }

    resolvedUserId = userId && typeof userId === 'string' ? userId : null;
  }

  if (!resolvedUserId) {
    return jsonResponse({ ok: true, ignored: true, reason: 'no matching user for email' });
  }

  // Stale event guard: ignore events older than the current profile state
  // Exception: cancelled/grace events always apply (safety net) — 취소/결제실패는 항상 적용
  if (action !== 'cancelled' && action !== 'grace') {
    const eventCreatedRaw = firstString(payload, ['created', 'data.created_at']);
    const eventCreatedMs = eventCreatedRaw ? Number(eventCreatedRaw) * 1000 : null;

    if (eventCreatedMs && Number.isFinite(eventCreatedMs)) {
      const { data: profile } = await supabase
        .from('kcl_user_profiles')
        .select('updated_at')
        .eq('id', resolvedUserId)
        .maybeSingle();

      const profileUpdatedMs = profile?.updated_at
        ? new Date(profile.updated_at).getTime()
        : 0;

      if (eventCreatedMs < profileUpdatedMs) {
        return jsonResponse({
          ok: true,
          ignored: true,
          reason: 'stale event: newer state already applied',
        });
      }
    }
  }

  const eventHash = await sha256Hex(`${normalizedEventName}:${rawBody}`);
  const { error: eventInsertError } = await supabase.from('kcl_bmc_webhook_events').insert({
    event_hash: eventHash,
    event_name: normalizedEventName,
    payload,
    processed_at: new Date().toISOString(),
  });

  if (eventInsertError) {
    if ((eventInsertError as { code?: string }).code === '23505') {
      return jsonResponse({ ok: true, ignored: true, reason: 'duplicate event' });
    }
    return jsonResponse({ error: 'Failed to persist webhook event' }, 500);
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const graceUntil = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  if (action === 'active') {
    await supabase
      .from('kcl_user_profiles')
      .update({ is_pro: true, pro_grace_until: null, updated_at: nowIso })
      .eq('id', resolvedUserId);

    await upsertSubscriptionRow({
      supabase,
      userId: resolvedUserId,
      email,
      membershipId,
      customerId,
      planId,
      status: 'active',
      renewsAt,
      endsAt: null,
      nowIso,
    });

    return jsonResponse({ ok: true, action: 'active', userId: resolvedUserId, membershipId });
  }

  if (action === 'grace') {
    await supabase
      .from('kcl_user_profiles')
      .update({ is_pro: true, pro_grace_until: graceUntil, updated_at: nowIso })
      .eq('id', resolvedUserId);

    await upsertSubscriptionRow({
      supabase,
      userId: resolvedUserId,
      email,
      membershipId,
      customerId,
      planId,
      status: 'past_due',
      renewsAt,
      endsAt: graceUntil,
      nowIso,
    });

    return jsonResponse({ ok: true, action: 'grace', userId: resolvedUserId, graceUntil });
  }

  await supabase
    .from('kcl_user_profiles')
    .update({ is_pro: false, pro_grace_until: null, updated_at: nowIso })
    .eq('id', resolvedUserId);

  await upsertSubscriptionRow({
    supabase,
    userId: resolvedUserId,
    email,
    membershipId,
    customerId,
    planId,
    status: 'cancelled',
    renewsAt,
    endsAt: nowIso,
    nowIso,
  });

  return jsonResponse({ ok: true, action: 'cancelled', userId: resolvedUserId, membershipId });
});
