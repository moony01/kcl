import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

type ReportMode = 'summary' | 'full';
type ReportLocale = 'ko' | 'en';
type JsonObject = Record<string, unknown>;

const BUCKET = 'kpopface-report-inputs';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_ORIGINS = new Set([
  'https://kclhq.com',
  'https://www.kclhq.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    insights: { type: 'array', items: { type: 'string' } },
    agency_fit: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          agency: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['agency', 'explanation'],
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
    styling: {
      type: 'object',
      additionalProperties: false,
      properties: {
        hair: { type: 'string' },
        makeup: { type: 'string' },
        concept: { type: 'string' },
      },
      required: ['hair', 'makeup', 'concept'],
    },
    audition_tips: { type: 'array', items: { type: 'string' } },
    disclaimer: { type: 'string' },
  },
  required: [
    'title',
    'summary',
    'insights',
    'agency_fit',
    'strengths',
    'styling',
    'audition_tips',
    'disclaimer',
  ],
} as const;

function jsonResponse(req: Request, body: JsonObject, status = 200): Response {
  const origin = req.headers.get('origin') || '';

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...(ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
      Vary: 'Origin',
    },
  });
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  return {
    ...(ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function isMode(value: unknown): value is ReportMode {
  return value === 'summary' || value === 'full';
}

function normalizeLocale(value: unknown): ReportLocale {
  return value === 'ko' ? 'ko' : 'en';
}

function isSafeInputPath(value: unknown, userId: string): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith(`${userId}/`) &&
    !value.includes('..') &&
    value.length <= 300
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isReportPayload(value: unknown): value is JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const report = value as JsonObject;
  const styling = report.styling;
  const agencyFit = report.agency_fit;

  return (
    typeof report.title === 'string' &&
    typeof report.summary === 'string' &&
    isStringArray(report.insights) &&
    isStringArray(report.strengths) &&
    isStringArray(report.audition_tips) &&
    typeof report.disclaimer === 'string' &&
    Array.isArray(agencyFit) &&
    agencyFit.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof (item as JsonObject).agency === 'string' &&
        typeof (item as JsonObject).explanation === 'string',
    ) &&
    styling !== null &&
    typeof styling === 'object' &&
    typeof (styling as JsonObject).hair === 'string' &&
    typeof (styling as JsonObject).makeup === 'string' &&
    typeof (styling as JsonObject).concept === 'string'
  );
}

function parseOutputText(value: string): JsonObject {
  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(cleaned) as JsonObject;
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';

  const response = payload as JsonObject;
  if (typeof response.output_text === 'string') return response.output_text;

  const output = Array.isArray(response.output) ? response.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const content = (item as JsonObject).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object' || Array.isArray(part)) continue;
      const text = (part as JsonObject).text;
      if (typeof text === 'string') chunks.push(text);
    }
  }

  return chunks.join('');
}

function buildPrompt(mode: ReportMode, locale: ReportLocale): string {
  const language = locale === 'ko' ? 'Korean' : 'English';
  const depth = mode === 'summary'
    ? 'Return a concise free summary with three practical insights.'
    : 'Return a detailed paid report with actionable styling, strengths, audition-photo tips, and several cautious agency-fit interpretations.';

  return [
    `Write the report in ${language}.`,
    'Analyze only visible presentation and styling cues in the supplied portrait photo.',
    'Do not identify the person, compare them to a celebrity, or infer age, race, ethnicity, nationality, gender identity, sexuality, health, personality, income, or other protected or sensitive traits.',
    'Do not claim an official agency evaluation, audition result, or probability of success.',
    'Do not produce numeric attractiveness, age, or agency-match scores. Use qualitative, clearly framed fit interpretations instead.',
    'If the photo is unclear, say so and keep the suggestions general.',
    depth,
    'Always include the disclaimer field and make it clear that this is an entertainment-style creative guide, not professional or official audition advice.',
  ].join('\n');
}

async function callOpenAI(
  imageDataUrl: string,
  mode: ReportMode,
  locale: ReportLocale,
  userId: string,
): Promise<{ report: JsonObject; model: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  // Vision + Responses structured outputs; override per environment when a
  // newer approved model is available.
  const model = Deno.env.get('OPENAI_REPORT_MODEL') || 'gpt-4.1-mini';

  if (!apiKey) {
    throw new Error('OPENAI_NOT_CONFIGURED');
  }

  const safetyDigest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(userId),
  );
  const safetyIdentifier = Array.from(new Uint8Array(safetyDigest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: safetyIdentifier,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: buildPrompt(mode, locale) },
            { type: 'input_image', image_url: imageDataUrl, detail: mode === 'full' ? 'high' : 'auto' },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'kpopface_report',
          strict: true,
          schema: REPORT_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[kpopface-report] OpenAI request failed:', response.status, errorText.slice(0, 500));
    throw new Error('OPENAI_REQUEST_FAILED');
  }

  const payload = await response.json() as unknown;
  const outputText = extractOutputText(payload);
  if (!outputText.trim()) {
    throw new Error('OPENAI_EMPTY_RESPONSE');
  }

  const report = parseOutputText(outputText);
  if (!isReportPayload(report)) {
    throw new Error('OPENAI_INVALID_REPORT');
  }

  return { report, model };
}

async function getUserFromRequest(
  req: Request,
  supabase: SupabaseClient,
): Promise<{ id: string } | null> {
  const authorization = req.headers.get('authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(req, { error: 'Server configuration unavailable' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const user = await getUserFromRequest(req, supabase);
  if (!user) {
    return jsonResponse(req, { error: 'Authentication required' }, 401);
  }

  let input: JsonObject;
  try {
    input = await req.json() as JsonObject;
  } catch {
    return jsonResponse(req, { error: 'Invalid JSON body' }, 400);
  }

  const mode = input.mode;
  const locale = normalizeLocale(input.locale);
  const inputPath = input.inputPath;
  if (!isMode(mode) || !isSafeInputPath(inputPath, user.id)) {
    return jsonResponse(req, { error: 'Invalid report request' }, 400);
  }

  const reportId = crypto.randomUUID();
  const { error: reportInsertError } = await supabase.from('kpopface_reports').insert({
    id: reportId,
    user_id: user.id,
    mode,
    locale,
    status: 'processing',
  });

  if (reportInsertError) {
    console.error('[kpopface-report] report insert failed:', reportInsertError.message);
    return jsonResponse(req, { error: 'Could not start report' }, 500);
  }

  let reserved = false;
  try {
    const { data: reservation, error: reservationError } = await supabase.rpc(
      'kpopface_reserve_report_credit',
      { p_user_id: user.id, p_mode: mode, p_report_id: reportId },
    );

    if (reservationError || !reservation?.ok) {
      const errorCode = reservation?.error_code || 'CREDIT_RESERVATION_FAILED';
      await supabase.from('kpopface_reports').update({ status: 'failed', error_code: errorCode }).eq('id', reportId);
      return jsonResponse(req, { error: errorCode }, 402);
    }
    reserved = true;

    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(inputPath);
    if (downloadError || !imageBlob) {
      throw new Error('IMAGE_DOWNLOAD_FAILED');
    }
    if (imageBlob.size > MAX_IMAGE_BYTES || !ALLOWED_MIME_TYPES.has(imageBlob.type)) {
      throw new Error('INVALID_IMAGE');
    }

    const mimeType = imageBlob.type || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${arrayBufferToBase64(await imageBlob.arrayBuffer())}`;
    const { report, model } = await callOpenAI(imageDataUrl, mode, locale, user.id);

    const { data: finalized, error: finalizeError } = await supabase.rpc(
      'kpopface_finalize_report',
      {
        p_user_id: user.id,
        p_mode: mode,
        p_report_id: reportId,
        p_report_json: report,
        p_model: model,
      },
    );
    if (finalizeError || !finalized?.ok) {
      throw new Error(finalized?.error_code || 'REPORT_FINALIZE_FAILED');
    }

    return jsonResponse(req, { ok: true, reportId });
  } catch (error) {
    const errorCode = error instanceof Error ? error.message : 'REPORT_FAILED';
    console.error('[kpopface-report] generation failed:', errorCode);

    await supabase.from('kpopface_reports').update({
      status: 'failed',
      error_code: errorCode.slice(0, 80),
      updated_at: new Date().toISOString(),
    }).eq('id', reportId);

    if (reserved) {
      await supabase.rpc('kpopface_refund_report_credit', {
        p_user_id: user.id,
        p_mode: mode,
        p_report_id: reportId,
        p_reason: errorCode,
      });
    }

    return jsonResponse(req, { error: 'Report generation failed', error_code: errorCode }, 502);
  } finally {
    const { error: deleteError } = await supabase.storage.from(BUCKET).remove([inputPath]);
    if (deleteError) {
      console.error('[kpopface-report] temporary image cleanup failed:', deleteError.message);
    }
  }
});
