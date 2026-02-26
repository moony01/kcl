-- ============================================
-- BMC account link table (KCL <-> BMC)
-- - allows pre-linking BMC checkout email to KCL user
-- - webhook can resolve user by linked BMC email first
-- ============================================

CREATE TABLE IF NOT EXISTS public.kcl_bmc_links (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bmc_email text NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kcl_bmc_links_user_id_unique UNIQUE (user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kcl_bmc_links_bmc_email_unique
  ON public.kcl_bmc_links (lower(bmc_email));

CREATE INDEX IF NOT EXISTS idx_kcl_bmc_links_user_id
  ON public.kcl_bmc_links (user_id);

ALTER TABLE public.kcl_bmc_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kcl_bmc_links_select_own ON public.kcl_bmc_links;
CREATE POLICY kcl_bmc_links_select_own ON public.kcl_bmc_links
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS kcl_bmc_links_insert_own ON public.kcl_bmc_links;
CREATE POLICY kcl_bmc_links_insert_own ON public.kcl_bmc_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS kcl_bmc_links_update_own ON public.kcl_bmc_links;
CREATE POLICY kcl_bmc_links_update_own ON public.kcl_bmc_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS kcl_bmc_links_delete_own ON public.kcl_bmc_links;
CREATE POLICY kcl_bmc_links_delete_own ON public.kcl_bmc_links
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.kcl_find_user_id_by_bmc_email(p_bmc_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_bmc_email IS NULL OR btrim(p_bmc_email) = '' THEN
    RETURN NULL;
  END IF;

  SELECT l.user_id
  INTO v_user_id
  FROM public.kcl_bmc_links l
  WHERE lower(l.bmc_email) = lower(btrim(p_bmc_email))
  ORDER BY l.updated_at DESC
  LIMIT 1;

  RETURN v_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_bmc_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_bmc_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.kcl_find_user_id_by_bmc_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.kcl_find_user_id_by_bmc_email(text) TO service_role;
