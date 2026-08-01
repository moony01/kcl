-- Retire the legacy Buy Me a Coffee integration.
-- Keep shared Pro profile fields for the replacement billing flow.
BEGIN;

DROP FUNCTION IF EXISTS public.kcl_find_user_id_by_bmc_email(text);
DROP FUNCTION IF EXISTS public.kcl_find_user_id_by_email(text);

DROP TABLE IF EXISTS public.kcl_bmc_webhook_events;
DROP TABLE IF EXISTS public.kcl_bmc_links;

COMMIT;
