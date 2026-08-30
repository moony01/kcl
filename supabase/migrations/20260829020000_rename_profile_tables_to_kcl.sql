-- The original profile MVP migration was already applied with mearrow_* names.
-- MEARROW is the only application in this Supabase project, so keep the
-- profile tables under short, product-level names without an app prefix.

ALTER TABLE IF EXISTS public.mearrow_profile_activities
  RENAME TO profile_activities;

ALTER TABLE IF EXISTS public.mearrow_profile_posts
  RENAME TO profile_posts;

ALTER TABLE IF EXISTS public.profile_activities
  RENAME CONSTRAINT mearrow_profile_activities_date_check
  TO profile_activities_date_check;
ALTER TABLE IF EXISTS public.profile_activities
  RENAME CONSTRAINT mearrow_profile_activities_current_check
  TO profile_activities_current_check;
ALTER TABLE IF EXISTS public.profile_posts
  RENAME CONSTRAINT mearrow_profile_posts_media_metadata_check
  TO profile_posts_media_metadata_check;

ALTER INDEX IF EXISTS public.idx_mearrow_profile_activities_user_start
  RENAME TO idx_profile_activities_user_start;

ALTER INDEX IF EXISTS public.idx_mearrow_profile_posts_user_created
  RENAME TO idx_profile_posts_user_created;

ALTER TRIGGER mearrow_profile_activities_set_updated_at
  ON public.profile_activities
  RENAME TO profile_activities_set_updated_at;

ALTER TRIGGER mearrow_profile_posts_set_updated_at
  ON public.profile_posts
  RENAME TO profile_posts_set_updated_at;

ALTER POLICY mearrow_profile_activities_public_read
  ON public.profile_activities
  RENAME TO profile_activities_public_read;
ALTER POLICY mearrow_profile_activities_insert_own
  ON public.profile_activities
  RENAME TO profile_activities_insert_own;
ALTER POLICY mearrow_profile_activities_update_own
  ON public.profile_activities
  RENAME TO profile_activities_update_own;
ALTER POLICY mearrow_profile_activities_delete_own
  ON public.profile_activities
  RENAME TO profile_activities_delete_own;

ALTER POLICY mearrow_profile_posts_public_read
  ON public.profile_posts
  RENAME TO profile_posts_public_read;
ALTER POLICY mearrow_profile_posts_insert_own
  ON public.profile_posts
  RENAME TO profile_posts_insert_own;
ALTER POLICY mearrow_profile_posts_update_own
  ON public.profile_posts
  RENAME TO profile_posts_update_own;
ALTER POLICY mearrow_profile_posts_delete_own
  ON public.profile_posts
  RENAME TO profile_posts_delete_own;

ALTER FUNCTION public.mearrow_profile_content_set_updated_at()
  RENAME TO profile_content_set_updated_at;
