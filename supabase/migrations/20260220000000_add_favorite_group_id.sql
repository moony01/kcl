-- T2.04: 최애 아이돌 그룹 컬럼 추가
ALTER TABLE public.kcl_user_profiles
ADD COLUMN IF NOT EXISTS favorite_group_id uuid REFERENCES public.kcl_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kcl_user_profiles_favorite_group_id
ON public.kcl_user_profiles(favorite_group_id);
