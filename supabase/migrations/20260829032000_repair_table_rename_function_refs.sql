-- Repair the one legacy function body left behind by the first table-rename
-- migration and remove duplicate functions that were created by its broad
-- source replacement. The original RPC names remain the public API.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_kcl_home_comment_likes_by_fingerprint(
  p_fingerprint text
)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT comment_id
  FROM public.home_comment_likes
  WHERE fingerprint = p_fingerprint;
$function$;

DROP FUNCTION IF EXISTS public.get_home_comment_likes_by_fingerprint(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_announcements_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_news_comments_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_news_views_updated_at() CASCADE;

COMMIT;
