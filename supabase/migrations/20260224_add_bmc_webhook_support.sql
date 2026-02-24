-- ============================================
-- BMC webhook support
-- - payment webhook event log (idempotency)
-- - profile grace period field
-- - helper function: find auth user by email
-- ============================================

ALTER TABLE public.kcl_user_profiles
ADD COLUMN IF NOT EXISTS pro_grace_until timestamptz;

CREATE TABLE IF NOT EXISTS public.kcl_bmc_webhook_events (
  id bigserial PRIMARY KEY,
  event_hash text NOT NULL,
  event_name text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kcl_bmc_webhook_events_event_hash
  ON public.kcl_bmc_webhook_events (event_hash);

CREATE INDEX IF NOT EXISTS idx_kcl_bmc_webhook_events_created_at
  ON public.kcl_bmc_webhook_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.kcl_find_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, auth
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.id
  INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_email))
  ORDER BY u.created_at ASC
  LIMIT 1;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.kcl_find_user_id_by_email(text) TO service_role;
