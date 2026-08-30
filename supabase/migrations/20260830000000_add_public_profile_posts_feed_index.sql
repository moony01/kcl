-- Support the public profile feed's filtered keyset-pagination order.
-- This is additive and leaves the existing owner-scoped index unchanged.
CREATE INDEX IF NOT EXISTS idx_profile_posts_public_created_id
  ON public.profile_posts (created_at DESC, id DESC)
  WHERE status = 'published' AND is_public = true;
