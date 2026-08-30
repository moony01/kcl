-- Keep public profile content readable while removing unnecessary table and
-- function privileges from the browser-facing roles.

BEGIN;

REVOKE ALL PRIVILEGES ON TABLE public.profile_activities, public.profile_posts FROM anon;
GRANT SELECT ON TABLE public.profile_activities, public.profile_posts TO anon;

REVOKE ALL PRIVILEGES ON TABLE public.profile_activities, public.profile_posts FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.profile_activities, public.profile_posts
  TO authenticated;

-- This SECURITY DEFINER function could mutate vote data when called directly
-- by an unauthenticated browser. Local quota reset is intentionally client-only.
DROP FUNCTION IF EXISTS public.reset_development_test_vote_quota();

COMMIT;
