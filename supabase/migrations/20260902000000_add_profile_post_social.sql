-- MEARROW public profile post social interactions.
-- Reads are public for published/public posts; writes are authenticated RPCs
-- so user_id always comes from auth.uid() instead of browser input.

BEGIN;

CREATE TABLE IF NOT EXISTS public.profile_post_likes (
  post_id uuid NOT NULL REFERENCES public.profile_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.profile_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.profile_posts (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 200),
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profile_post_likes_post_id
  ON public.profile_post_likes (post_id);

CREATE INDEX IF NOT EXISTS idx_profile_post_comments_post_created
  ON public.profile_post_comments (post_id, created_at DESC, id DESC)
  WHERE is_deleted = false;

CREATE OR REPLACE FUNCTION public.profile_post_comments_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS profile_post_comments_set_updated_at
  ON public.profile_post_comments;

CREATE TRIGGER profile_post_comments_set_updated_at
  BEFORE UPDATE ON public.profile_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.profile_post_comments_set_updated_at();

ALTER TABLE public.profile_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_post_likes_public_read
  ON public.profile_post_likes;

CREATE POLICY profile_post_likes_public_read
  ON public.profile_post_likes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profile_posts AS post
      WHERE post.id = profile_post_likes.post_id
        AND post.status = 'published'
        AND post.is_public = true
    )
  );

DROP POLICY IF EXISTS profile_post_comments_public_read
  ON public.profile_post_comments;

CREATE POLICY profile_post_comments_public_read
  ON public.profile_post_comments
  FOR SELECT
  TO anon, authenticated
  USING (
    is_deleted = false
    AND EXISTS (
      SELECT 1
      FROM public.profile_posts AS post
      WHERE post.id = profile_post_comments.post_id
        AND post.status = 'published'
        AND post.is_public = true
    )
  );

-- Like membership is intentionally only exposed through the aggregate RPC.
-- Do not grant direct SELECT: the table contains each user's auth UUID.
REVOKE ALL PRIVILEGES ON TABLE public.profile_post_likes FROM anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.profile_post_comments FROM anon, authenticated;
GRANT SELECT ON TABLE public.profile_post_comments TO anon, authenticated;

-- Return one row per visible requested post. The client zero-fills IDs that
-- are not visible so private/draft post existence is never disclosed.
CREATE OR REPLACE FUNCTION public.get_profile_post_social(p_post_ids uuid[])
RETURNS TABLE (
  post_id uuid,
  likes_count bigint,
  comments_count bigint,
  liked_by_viewer boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    post.id AS post_id,
    (
      SELECT count(*)::bigint
      FROM public.profile_post_likes AS post_like
      WHERE post_like.post_id = post.id
    ) AS likes_count,
    (
      SELECT count(*)::bigint
      FROM public.profile_post_comments AS comment
      WHERE comment.post_id = post.id
        AND comment.is_deleted = false
    ) AS comments_count,
    EXISTS (
      SELECT 1
      FROM public.profile_post_likes AS viewer_like
      WHERE viewer_like.post_id = post.id
        AND viewer_like.user_id = auth.uid()
    ) AS liked_by_viewer
  FROM public.profile_posts AS post
  WHERE post.id = ANY(COALESCE(p_post_ids, ARRAY[]::uuid[]))
    AND post.status = 'published'
    AND post.is_public = true;
$function$;

CREATE OR REPLACE FUNCTION public.toggle_profile_post_like(
  p_post_id uuid,
  p_liked boolean
)
RETURNS TABLE (
  liked boolean,
  likes_count bigint
)
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
    FROM public.profile_posts AS post
    WHERE post.id = p_post_id
      AND post.status = 'published'
      AND post.is_public = true
  ) THEN
    RAISE EXCEPTION 'profile post is not public'
      USING errcode = '42501';
  END IF;

  IF COALESCE(p_liked, false) THEN
    INSERT INTO public.profile_post_likes (post_id, user_id)
    VALUES (p_post_id, current_user_id)
    ON CONFLICT (post_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM public.profile_post_likes
    WHERE post_id = p_post_id
      AND user_id = current_user_id;
  END IF;

  RETURN QUERY
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profile_post_likes AS post_like
      WHERE post_like.post_id = p_post_id
        AND post_like.user_id = current_user_id
    ),
    count(*)::bigint
  FROM public.profile_post_likes AS post_like
  WHERE post_like.post_id = p_post_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_profile_post_comment(
  p_post_id uuid,
  p_content text
)
RETURNS TABLE (
  id uuid,
  post_id uuid,
  user_id uuid,
  content text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  trimmed_content text := btrim(COALESCE(p_content, ''));
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required'
      USING errcode = '42501';
  END IF;

  IF char_length(trimmed_content) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'comment must be between 1 and 200 characters'
      USING errcode = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profile_posts AS post
    WHERE post.id = p_post_id
      AND post.status = 'published'
      AND post.is_public = true
  ) THEN
    RAISE EXCEPTION 'profile post is not public'
      USING errcode = '42501';
  END IF;

  RETURN QUERY
  INSERT INTO public.profile_post_comments (post_id, user_id, content)
  VALUES (p_post_id, current_user_id, trimmed_content)
  RETURNING
    profile_post_comments.id,
    profile_post_comments.post_id,
    profile_post_comments.user_id,
    profile_post_comments.content,
    profile_post_comments.created_at,
    profile_post_comments.updated_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_profile_post_comment(p_comment_id uuid)
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

  UPDATE public.profile_post_comments
  SET is_deleted = true,
      updated_at = timezone('utc', now())
  WHERE id = p_comment_id
    AND user_id = current_user_id
    AND is_deleted = false;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_profile_post_social(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_post_social(uuid[]) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.toggle_profile_post_like(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_profile_post_like(uuid, boolean) TO authenticated;

REVOKE ALL ON FUNCTION public.create_profile_post_comment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_profile_post_comment(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.delete_profile_post_comment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_profile_post_comment(uuid) TO authenticated;

COMMIT;
