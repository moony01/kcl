-- Kpopface AI report credits, reports, and Stripe payment ledger.
-- Raw photos are uploaded to a private bucket for one request only and are
-- deleted by the report Edge Function in a finally block.

CREATE TABLE IF NOT EXISTS public.kpopface_report_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  free_claimed boolean NOT NULL DEFAULT false,
  free_in_progress boolean NOT NULL DEFAULT false,
  paid_credits integer NOT NULL DEFAULT 0 CHECK (paid_credits >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpopface_report_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  reference text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpopface_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('summary', 'full')),
  locale text NOT NULL CHECK (locale IN ('ko', 'en')),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  report_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpopface_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text,
  product text NOT NULL DEFAULT 'kpopface_report_pack_5',
  quantity integer NOT NULL DEFAULT 5 CHECK (quantity > 0),
  amount_cents integer NOT NULL DEFAULT 499 CHECK (amount_cents > 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kpopface_reports_user_created_idx
  ON public.kpopface_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kpopface_report_ledger_user_created_idx
  ON public.kpopface_report_credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kpopface_payments_user_created_idx
  ON public.kpopface_payments(user_id, created_at DESC);

ALTER TABLE public.kpopface_report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpopface_report_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpopface_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpopface_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpopface_report_credits_select_own" ON public.kpopface_report_credits;
CREATE POLICY "kpopface_report_credits_select_own"
  ON public.kpopface_report_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "kpopface_report_ledger_select_own" ON public.kpopface_report_credit_ledger;
CREATE POLICY "kpopface_report_ledger_select_own"
  ON public.kpopface_report_credit_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "kpopface_reports_select_own" ON public.kpopface_reports;
CREATE POLICY "kpopface_reports_select_own"
  ON public.kpopface_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "kpopface_payments_select_own" ON public.kpopface_payments;
CREATE POLICY "kpopface_payments_select_own"
  ON public.kpopface_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Private, per-user upload area. The report function uses the service role to
-- download/delete the object, so end users do not receive read access.
INSERT INTO storage.buckets (id, name, public)
VALUES ('kpopface-report-inputs', 'kpopface-report-inputs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "kpopface_report_inputs_insert_own" ON storage.objects;
CREATE POLICY "kpopface_report_inputs_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kpopface-report-inputs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "kpopface_report_inputs_delete_own" ON storage.objects;
CREATE POLICY "kpopface_report_inputs_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'kpopface-report-inputs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE OR REPLACE FUNCTION public.kpopface_reserve_report_credit(
  p_user_id uuid,
  p_mode text,
  p_report_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_credits public.kpopface_report_credits%ROWTYPE;
  v_reference text := 'report_reservation:' || p_report_id::text;
BEGIN
  IF p_user_id IS NULL OR p_report_id IS NULL OR p_mode NOT IN ('summary', 'full') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'INVALID_REQUEST');
  END IF;

  INSERT INTO public.kpopface_report_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_credits
  FROM public.kpopface_report_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.kpopface_report_credit_ledger
    WHERE user_id = p_user_id AND reference = v_reference
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_reserved', true);
  END IF;

  IF p_mode = 'summary' THEN
    IF v_credits.free_claimed OR v_credits.free_in_progress THEN
      RETURN jsonb_build_object('ok', false, 'error_code', 'FREE_REPORT_ALREADY_USED');
    END IF;

    UPDATE public.kpopface_report_credits
    SET free_in_progress = true, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    IF v_credits.paid_credits < 1 THEN
      RETURN jsonb_build_object('ok', false, 'error_code', 'NO_PAID_CREDITS');
    END IF;

    UPDATE public.kpopface_report_credits
    SET paid_credits = paid_credits - 1, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.kpopface_report_credit_ledger (user_id, delta, reason, reference, metadata)
  VALUES (
    p_user_id,
    CASE WHEN p_mode = 'full' THEN -1 ELSE 0 END,
    CASE WHEN p_mode = 'full' THEN 'paid_report_reservation' ELSE 'free_report_reservation' END,
    v_reference,
    jsonb_build_object('mode', p_mode, 'report_id', p_report_id)
  );

  RETURN jsonb_build_object('ok', true, 'already_reserved', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.kpopface_complete_report(
  p_user_id uuid,
  p_mode text,
  p_report_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL OR p_report_id IS NULL OR p_mode NOT IN ('summary', 'full') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'INVALID_REQUEST');
  END IF;

  IF p_mode = 'summary' THEN
    UPDATE public.kpopface_report_credits
    SET free_claimed = true, free_in_progress = false, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.kpopface_report_credits
    SET updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.kpopface_finalize_report(
  p_user_id uuid,
  p_mode text,
  p_report_id uuid,
  p_report_json jsonb,
  p_model text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL OR p_report_id IS NULL OR p_mode NOT IN ('summary', 'full') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'INVALID_REQUEST');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kpopface_report_credit_ledger
    WHERE user_id = p_user_id
      AND reference = 'report_reservation:' || p_report_id::text
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'RESERVATION_NOT_FOUND');
  END IF;

  IF p_mode = 'summary' THEN
    UPDATE public.kpopface_report_credits
    SET free_claimed = true, free_in_progress = false, updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.kpopface_report_credits
    SET updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  UPDATE public.kpopface_reports
  SET status = 'completed',
      report_json = COALESCE(p_report_json, '{}'::jsonb),
      model = p_model,
      error_code = NULL,
      completed_at = now(),
      updated_at = now()
  WHERE id = p_report_id AND user_id = p_user_id AND mode = p_mode;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'REPORT_NOT_FOUND');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.kpopface_refund_report_credit(
  p_user_id uuid,
  p_mode text,
  p_report_id uuid,
  p_reason text DEFAULT 'report_failed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reference text := 'report_refund:' || p_report_id::text;
BEGIN
  IF p_user_id IS NULL OR p_report_id IS NULL OR p_mode NOT IN ('summary', 'full') THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'INVALID_REQUEST');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.kpopface_report_credit_ledger
    WHERE user_id = p_user_id AND reference = v_reference
  ) THEN
    IF p_mode = 'summary' THEN
      UPDATE public.kpopface_report_credits
      SET free_in_progress = false, updated_at = now()
      WHERE user_id = p_user_id;
    ELSE
      UPDATE public.kpopface_report_credits
      SET paid_credits = paid_credits + 1, updated_at = now()
      WHERE user_id = p_user_id;
    END IF;

    INSERT INTO public.kpopface_report_credit_ledger (user_id, delta, reason, reference, metadata)
    VALUES (
      p_user_id,
      CASE WHEN p_mode = 'full' THEN 1 ELSE 0 END,
      p_reason,
      v_reference,
      jsonb_build_object('mode', p_mode, 'report_id', p_report_id)
    );
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.kpopface_grant_paid_credits(
  p_user_id uuid,
  p_quantity integer,
  p_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance integer;
BEGIN
  IF p_user_id IS NULL OR p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 50
     OR p_reference IS NULL OR length(trim(p_reference)) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error_code', 'INVALID_REQUEST');
  END IF;

  INSERT INTO public.kpopface_report_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF EXISTS (
    SELECT 1 FROM public.kpopface_report_credit_ledger
    WHERE reference = p_reference
  ) THEN
    SELECT paid_credits INTO v_balance
    FROM public.kpopface_report_credits
    WHERE user_id = p_user_id;
    RETURN jsonb_build_object('ok', true, 'already_granted', true, 'paid_credits', v_balance);
  END IF;

  UPDATE public.kpopface_report_credits
  SET paid_credits = paid_credits + p_quantity, updated_at = now()
  WHERE user_id = p_user_id
  RETURNING paid_credits INTO v_balance;

  INSERT INTO public.kpopface_report_credit_ledger (user_id, delta, reason, reference, metadata)
  VALUES (
    p_user_id,
    p_quantity,
    'stripe_report_pack',
    p_reference,
    jsonb_build_object('quantity', p_quantity)
  );

  RETURN jsonb_build_object('ok', true, 'already_granted', false, 'paid_credits', v_balance);
END;
$function$;

REVOKE ALL ON FUNCTION public.kpopface_reserve_report_credit(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kpopface_complete_report(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kpopface_finalize_report(uuid, text, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kpopface_refund_report_credit(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.kpopface_grant_paid_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kpopface_reserve_report_credit(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.kpopface_complete_report(uuid, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.kpopface_finalize_report(uuid, text, uuid, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.kpopface_refund_report_credit(uuid, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.kpopface_grant_paid_credits(uuid, integer, text) TO service_role;
