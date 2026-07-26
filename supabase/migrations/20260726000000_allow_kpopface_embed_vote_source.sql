-- Allow the dedicated Kpopface iframe vote source recorded by
-- submit_kpopface_embed_vote().  The original constraint predates the embed
-- and only accepted web, mobile, and api values, which caused each embed
-- submission to fail during the kcl_votes insert.
ALTER TABLE public.kcl_votes
  DROP CONSTRAINT IF EXISTS kcl_check_vote_source;

ALTER TABLE public.kcl_votes
  ADD CONSTRAINT kcl_check_vote_source
  CHECK (vote_source = ANY (ARRAY[
    'web'::text,
    'mobile'::text,
    'api'::text,
    'kpopface_embed'::text
  ]));
