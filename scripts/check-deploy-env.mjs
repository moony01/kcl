#!/usr/bin/env node

const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  console.error(
    `[deploy-env] Missing required deployment environment variable(s): ${missing.join(', ')}`,
  );
  console.error(
    '[deploy-env] Refusing to build or deploy because the browser data client would be unavailable.',
  );
  process.exit(1);
}

let parsedUrl;
try {
  parsedUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
} catch {
  console.error('[deploy-env] NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
  process.exit(1);
}

if (parsedUrl.protocol !== 'https:') {
  console.error('[deploy-env] NEXT_PUBLIC_SUPABASE_URL must use HTTPS.');
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 20) {
  console.error('[deploy-env] NEXT_PUBLIC_SUPABASE_ANON_KEY is unexpectedly short.');
  process.exit(1);
}

console.log(
  `[deploy-env] OK: ${parsedUrl.origin}; NEXT_PUBLIC_SUPABASE_ANON_KEY present (length=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length})`,
);
