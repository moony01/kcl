-- MEARROW is the only application in this Supabase project.
-- Remove the copied resources belonging to the other applications.
-- Supabase's auth schema and auth.users/auth.identities are intentionally kept.

BEGIN;

-- Remove foreign RPCs before their backing tables. The prefix-based block is
-- limited to the known foreign app/admin/server namespaces; KCL RPCs such as
-- submit_vote_secure and delete_user_app_data are intentionally preserved.
DO $function$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (
        p.proname LIKE 'fn_admin_%'
        OR p.proname LIKE 'fn_app_%'
        OR p.proname LIKE 'fn_srv_%'
        OR p.proname LIKE 'fn_is_%'
        OR p.proname LIKE 'fn_public_%'
      )
  LOOP
    EXECUTE format(
      'DROP FUNCTION IF EXISTS public.%I(%s) CASCADE',
      target.proname,
      target.identity_arguments
    );
  END LOOP;
END;
$function$;

DROP FUNCTION IF EXISTS public.delete_comment(bigint, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_inquiry(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.delete_sgt_comment(integer, text) CASCADE;
DROP FUNCTION IF EXISTS public.get_inquiry_content(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.increment_inquiry_view(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.increment_reaction(text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_sgt_vote(text) CASCADE;
DROP FUNCTION IF EXISTS public.increment_vote(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_comment(bigint, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_inquiry(uuid, text, text, text, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.update_sgt_comment(integer, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- This view is the only non-table public relation in the foreign-app set.
DROP VIEW IF EXISTS public.plz_inquiries_list_view CASCADE;

-- Remove all known foreign application tables. CASCADE also removes their
-- policies, table-owned triggers, indexes, and dependent constraints.
DROP TABLE IF EXISTS
  public.admin_accounts,
  public.admin_audit_logs,
  public.admin_login_attempts,
  public.app_auth_sessions,
  public.app_memberships,
  public.app_releases,
  public.app_settings,
  public.content_attempts,
  public.content_move_quest_details,
  public.content_quiz_details,
  public.content_quiz_options,
  public.content_short_answer_keys,
  public.content_verification_quest_details,
  public.contents,
  public.device_tokens,
  public.edge_function_rate_limits,
  public.edge_function_scope_rate_limits,
  public.gps_location_logs,
  public.group_exploration_runs,
  public.group_members,
  public.groups,
  public.kft_app_stats,
  public.kft_comments,
  public.kft_vote_counts,
  public.legal_documents,
  public.notice_attachments,
  public.notice_comments,
  public.notices,
  public.notification_settings,
  public.phone_verification_requests,
  public.plz_inquiries,
  public.plz_project_requests,
  public.point_ledger,
  public.progress_reset_attempt_backups,
  public.progress_reset_batches,
  public.progress_reset_content_backups,
  public.progress_reset_qr_backups,
  public.push_notifications,
  public.qr_codes,
  public.qr_content_maps,
  public.qr_scan_logs,
  public.runtime_config,
  public.sgt_comments,
  public.sgt_vote_counts,
  public.spots,
  public.tracking_sessions,
  public.user_consents,
  public.user_content_progress,
  public.user_device_permission_states,
  public.user_profiles,
  public.user_qr_progress,
  public.user_tracking_states,
  public.verification_submissions
CASCADE;

-- Keep the MEARROW avatar and profile-media buckets. Remove only the foreign
-- notice/verification buckets and their objects through the guarded storage
-- cleanup path required by Supabase Storage.
SET LOCAL storage.allow_delete_query = 'true';
DELETE FROM storage.objects
 WHERE bucket_id IN ('notices', 'verifications');
DELETE FROM storage.buckets
 WHERE id IN ('notices', 'verifications');

COMMIT;
