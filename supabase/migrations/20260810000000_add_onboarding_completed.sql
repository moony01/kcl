-- Persist onboarding completion independently from the optional favorite group.
-- A boolean avoids exposing an unnecessary completion timestamp through the
-- profile table's existing public SELECT policy.
ALTER TABLE public.kcl_user_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.kcl_user_profiles.onboarding_completed IS
'Whether the user completed onboarding or skipped its optional fields.';

-- Explicit legacy compatibility policy; this is not proof that the historical
-- onboarding UI was completed. Treat a selected favorite group or authenticated
-- interaction more than one second after profile creation as completed so active
-- legacy users are not repeatedly prompted. Vote RPCs also update updated_at, and
-- that interaction is intentionally included. Leave untouched profiles false.
UPDATE public.kcl_user_profiles
SET onboarding_completed = true
WHERE onboarding_completed = false
  AND (
    favorite_group_id IS NOT NULL
    OR updated_at > created_at + interval '1 second'
  );
