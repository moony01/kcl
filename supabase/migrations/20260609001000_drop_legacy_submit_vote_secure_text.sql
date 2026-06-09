-- Drop legacy text-typed overload so PostgREST can resolve the uuid RPC unambiguously.
DROP FUNCTION IF EXISTS public.submit_vote_secure(text, text, text, integer, uuid, integer);
