-- MEARROW following MVP
-- Authenticated users can follow companies and artist groups. The two tables
-- keep real foreign keys so a follow can never point at an unknown target.

BEGIN;

CREATE TABLE IF NOT EXISTS public.company_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.group_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_company_follows_user_created
  ON public.company_follows (user_id, created_at DESC, company_id);

CREATE INDEX IF NOT EXISTS idx_group_follows_user_created
  ON public.group_follows (user_id, created_at DESC, group_id);

ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_follows_select_own ON public.company_follows;
CREATE POLICY company_follows_select_own
  ON public.company_follows
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS group_follows_select_own ON public.group_follows;
CREATE POLICY group_follows_select_own
  ON public.group_follows
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- All writes go through auth.uid()-bound functions below. Direct table writes
-- stay revoked so a browser cannot impersonate another user's user_id.
REVOKE ALL PRIVILEGES ON TABLE public.company_follows FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.group_follows FROM anon, authenticated;
GRANT SELECT ON TABLE public.company_follows TO authenticated;
GRANT SELECT ON TABLE public.group_follows TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_company_follow(
  p_company_id uuid,
  p_follow boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required'
      USING errcode = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = p_company_id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'company not found'
      USING errcode = '22023';
  END IF;

  IF COALESCE(p_follow, false) THEN
    INSERT INTO public.company_follows (user_id, company_id)
    VALUES (current_user_id, p_company_id)
    ON CONFLICT (user_id, company_id) DO NOTHING;
  ELSE
    DELETE FROM public.company_follows
    WHERE user_id = current_user_id
      AND company_id = p_company_id;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.company_follows
    WHERE user_id = current_user_id
      AND company_id = p_company_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_group_follow(
  p_group_id uuid,
  p_follow boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required'
      USING errcode = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE id = p_group_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'group not found'
      USING errcode = '22023';
  END IF;

  IF COALESCE(p_follow, false) THEN
    INSERT INTO public.group_follows (user_id, group_id)
    VALUES (current_user_id, p_group_id)
    ON CONFLICT (user_id, group_id) DO NOTHING;
  ELSE
    DELETE FROM public.group_follows
    WHERE user_id = current_user_id
      AND group_id = p_group_id;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.group_follows
    WHERE user_id = current_user_id
      AND group_id = p_group_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.toggle_company_follow(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_company_follow(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.toggle_group_follow(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_group_follow(uuid, boolean) TO authenticated;

COMMIT;
