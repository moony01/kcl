-- MEARROW owns the whole project, so remove the legacy kcl_ table namespace.
-- Data, grants, RLS enablement, constraints, indexes, and relationships stay
-- on the same relations; only relation names are changed.

BEGIN;

ALTER TABLE IF EXISTS public.kcl_announcements
  RENAME TO announcements;
ALTER TABLE IF EXISTS public.kcl_companies
  RENAME TO companies;
ALTER TABLE IF EXISTS public.kcl_groups
  RENAME TO groups;
ALTER TABLE IF EXISTS public.kcl_home_comment_likes
  RENAME TO home_comment_likes;
ALTER TABLE IF EXISTS public.kcl_home_comments
  RENAME TO home_comments;
ALTER TABLE IF EXISTS public.kcl_news_comments
  RENAME TO news_comments;
ALTER TABLE IF EXISTS public.kcl_news_views
  RENAME TO news_views;
ALTER TABLE IF EXISTS public.kcl_notice_comments
  RENAME TO notice_comments;
ALTER TABLE IF EXISTS public.kcl_season_rankings
  RENAME TO season_rankings;
ALTER TABLE IF EXISTS public.kcl_seasons
  RENAME TO seasons;
ALTER TABLE IF EXISTS public.kcl_user_profiles
  RENAME TO user_profiles;
ALTER TABLE IF EXISTS public.kcl_vote_quota_overrides
  RENAME TO vote_quota_overrides;
ALTER TABLE IF EXISTS public.kcl_votes
  RENAME TO votes;

-- PL/pgSQL bodies are stored as source text. Refresh every remaining public
-- function so RPCs and trigger functions resolve the new relation names.
DO $function$
DECLARE
  target record;
  old_definition text;
  new_definition text;
  body_definition text;
  body_start integer;
BEGIN
  FOR target IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    old_definition := pg_get_functiondef(target.oid);
    body_start := strpos(old_definition, '$function$');
    IF body_start = 0 THEN
      CONTINUE;
    END IF;

    -- Keep the function header untouched. Some RPC names themselves contain
    -- a legacy table token (for example get_kcl_home_comment_likes...), so a
    -- whole-definition replacement would accidentally create duplicate RPCs.
    new_definition := left(old_definition, body_start + length('$function$') - 1);
    body_definition := substr(old_definition, body_start + length('$function$'));

    body_definition := replace(body_definition, 'public.kcl_announcements', 'public.announcements');
    body_definition := replace(body_definition, 'kcl_announcements', 'announcements');
    body_definition := replace(body_definition, 'public.kcl_companies', 'public.companies');
    body_definition := replace(body_definition, 'kcl_companies', 'companies');
    body_definition := replace(body_definition, 'public.kcl_groups', 'public.groups');
    body_definition := replace(body_definition, 'kcl_groups', 'groups');
    body_definition := replace(body_definition, 'public.kcl_home_comment_likes', 'public.home_comment_likes');
    body_definition := replace(body_definition, 'kcl_home_comment_likes', 'home_comment_likes');
    body_definition := replace(body_definition, 'public.kcl_home_comments', 'public.home_comments');
    body_definition := replace(body_definition, 'kcl_home_comments', 'home_comments');
    body_definition := replace(body_definition, 'public.kcl_news_comments', 'public.news_comments');
    body_definition := replace(body_definition, 'kcl_news_comments', 'news_comments');
    body_definition := replace(body_definition, 'public.kcl_news_views', 'public.news_views');
    body_definition := replace(body_definition, 'kcl_news_views', 'news_views');
    body_definition := replace(body_definition, 'public.kcl_notice_comments', 'public.notice_comments');
    body_definition := replace(body_definition, 'kcl_notice_comments', 'notice_comments');
    body_definition := replace(body_definition, 'public.kcl_season_rankings', 'public.season_rankings');
    body_definition := replace(body_definition, 'kcl_season_rankings', 'season_rankings');
    body_definition := replace(body_definition, 'public.kcl_seasons', 'public.seasons');
    body_definition := replace(body_definition, 'kcl_seasons', 'seasons');
    body_definition := replace(body_definition, 'public.kcl_user_profiles', 'public.user_profiles');
    body_definition := replace(body_definition, 'kcl_user_profiles', 'user_profiles');
    body_definition := replace(body_definition, 'public.kcl_vote_quota_overrides', 'public.vote_quota_overrides');
    body_definition := replace(body_definition, 'kcl_vote_quota_overrides', 'vote_quota_overrides');
    body_definition := replace(body_definition, 'public.kcl_votes', 'public.votes');
    body_definition := replace(body_definition, 'kcl_votes', 'votes');
    new_definition := new_definition || body_definition;

    IF new_definition <> old_definition THEN
      EXECUTE new_definition;
    END IF;
  END LOOP;
END;
$function$;

COMMIT;
