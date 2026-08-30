-- ============================================
-- MEARROW profile content MVP
-- - trainee activity history
-- - public image / shorts feed
-- ============================================

CREATE TABLE IF NOT EXISTS public.mearrow_profile_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
  organization text CHECK (organization IS NULL OR char_length(btrim(organization)) <= 120),
  start_date date NOT NULL,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'other'
    CHECK (category IN ('training', 'audition', 'showcase', 'education', 'other')),
  description text CHECK (description IS NULL OR char_length(description) <= 500),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mearrow_profile_activities_date_check
    CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT mearrow_profile_activities_current_check
    CHECK (is_current OR end_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_mearrow_profile_activities_user_start
  ON public.mearrow_profile_activities (user_id, start_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.mearrow_profile_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'short')),
  storage_path text NOT NULL UNIQUE
    CHECK (storage_path ~ ('^' || user_id::text || '/[^/]+$')),
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800),
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 60),
  caption text CHECK (caption IS NULL OR char_length(caption) <= 240),
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mearrow_profile_posts_media_metadata_check
    CHECK (
      (
        media_type = 'image'
        AND mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/heic')
        AND file_size_bytes <= 10485760
        AND duration_seconds IS NULL
      )
      OR (
        media_type = 'short'
        AND mime_type IN ('video/mp4', 'video/webm', 'video/quicktime')
        AND duration_seconds BETWEEN 1 AND 60
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_mearrow_profile_posts_user_created
  ON public.mearrow_profile_posts (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.mearrow_profile_content_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS mearrow_profile_activities_set_updated_at
  ON public.mearrow_profile_activities;
CREATE TRIGGER mearrow_profile_activities_set_updated_at
  BEFORE UPDATE ON public.mearrow_profile_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.mearrow_profile_content_set_updated_at();

DROP TRIGGER IF EXISTS mearrow_profile_posts_set_updated_at
  ON public.mearrow_profile_posts;
CREATE TRIGGER mearrow_profile_posts_set_updated_at
  BEFORE UPDATE ON public.mearrow_profile_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.mearrow_profile_content_set_updated_at();

ALTER TABLE public.mearrow_profile_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mearrow_profile_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mearrow_profile_activities_public_read
  ON public.mearrow_profile_activities;
CREATE POLICY mearrow_profile_activities_public_read
  ON public.mearrow_profile_activities
  FOR SELECT TO anon, authenticated
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_activities_insert_own
  ON public.mearrow_profile_activities;
CREATE POLICY mearrow_profile_activities_insert_own
  ON public.mearrow_profile_activities
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_activities_update_own
  ON public.mearrow_profile_activities;
CREATE POLICY mearrow_profile_activities_update_own
  ON public.mearrow_profile_activities
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_activities_delete_own
  ON public.mearrow_profile_activities;
CREATE POLICY mearrow_profile_activities_delete_own
  ON public.mearrow_profile_activities
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_posts_public_read
  ON public.mearrow_profile_posts;
CREATE POLICY mearrow_profile_posts_public_read
  ON public.mearrow_profile_posts
  FOR SELECT TO anon, authenticated
  USING (
    (is_public = true AND status = 'published')
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS mearrow_profile_posts_insert_own
  ON public.mearrow_profile_posts;
CREATE POLICY mearrow_profile_posts_insert_own
  ON public.mearrow_profile_posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_posts_update_own
  ON public.mearrow_profile_posts;
CREATE POLICY mearrow_profile_posts_update_own
  ON public.mearrow_profile_posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS mearrow_profile_posts_delete_own
  ON public.mearrow_profile_posts;
CREATE POLICY mearrow_profile_posts_delete_own
  ON public.mearrow_profile_posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.mearrow_profile_activities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mearrow_profile_activities TO authenticated;
GRANT SELECT ON public.mearrow_profile_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mearrow_profile_posts TO authenticated;

DO $function$
DECLARE
  existing_public boolean;
  existing_size bigint;
  existing_types text[];
  expected_types text[] := ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-images') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('profile-images', 'profile-images', true, 10485760, expected_types);
  END IF;

  SELECT public, file_size_limit, allowed_mime_types
    INTO existing_public, existing_size, existing_types
    FROM storage.buckets
   WHERE id = 'profile-images';

  IF existing_public IS DISTINCT FROM true
     OR existing_size IS DISTINCT FROM 10485760
     OR existing_types IS DISTINCT FROM expected_types THEN
    RAISE EXCEPTION 'profile-images bucket exists with an incompatible configuration';
  END IF;
END;
$function$;

DO $function$
DECLARE
  existing_public boolean;
  existing_size bigint;
  existing_types text[];
  expected_types text[] := ARRAY['video/mp4', 'video/webm', 'video/quicktime'];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'profile-shorts') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('profile-shorts', 'profile-shorts', true, 52428800, expected_types);
  END IF;

  SELECT public, file_size_limit, allowed_mime_types
    INTO existing_public, existing_size, existing_types
    FROM storage.buckets
   WHERE id = 'profile-shorts';

  IF existing_public IS DISTINCT FROM true
     OR existing_size IS DISTINCT FROM 52428800
     OR existing_types IS DISTINCT FROM expected_types THEN
    RAISE EXCEPTION 'profile-shorts bucket exists with an incompatible configuration';
  END IF;
END;
$function$;

DROP POLICY IF EXISTS mearrow_profile_feed_public_read ON storage.objects;
DROP POLICY IF EXISTS mearrow_profile_feed_insert_own ON storage.objects;
DROP POLICY IF EXISTS mearrow_profile_feed_update_own ON storage.objects;
DROP POLICY IF EXISTS mearrow_profile_feed_delete_own ON storage.objects;

DROP POLICY IF EXISTS mearrow_profile_media_insert_own ON storage.objects;
CREATE POLICY mearrow_profile_media_insert_own
  ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('profile-images', 'profile-shorts')
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS mearrow_profile_media_update_own ON storage.objects;
CREATE POLICY mearrow_profile_media_update_own
  ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('profile-images', 'profile-shorts')
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('profile-images', 'profile-shorts')
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS mearrow_profile_media_delete_own ON storage.objects;
CREATE POLICY mearrow_profile_media_delete_own
  ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('profile-images', 'profile-shorts')
    AND split_part(name, '/', 1) = auth.uid()::text
  );
