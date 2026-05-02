-- Fix: snapshot_season_rankings month check bug + race condition protection
--
-- Bug: The RPC was checking if a snapshot exists for "previous month"
-- (NOW() - INTERVAL '1 month'). When triggered mid-month (e.g., April 30),
-- the previous month (March) already has a snapshot, so the function skips --
-- leaving the current month's data unsaved before monthly_league_promotion
-- resets firepower. April 2026 incident: firepower was reset on April 30
-- without an April snapshot being created.
--
-- Fix 1: Change target to current month (DATE_TRUNC('month', NOW())) so the
--        function skips only when the CURRENT month's snapshot already exists.
-- Fix 2: Advisory lock prevents duplicate inserts on concurrent calls.
-- Fix 3: UNIQUE constraint on (year, month, company_id) as last-resort guard.
--
-- Note: record_monthly_champion has the same month-check bug pattern but
-- its champion-determination logic could not be safely reconstructed without
-- access to the original source. That function needs the same fix applied
-- directly via Supabase Dashboard SQL editor.

-- ============================================================
-- 1. UNIQUE constraint on kcl_season_rankings (race guard)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kcl_season_rankings_year_month_company_unique'
  ) THEN
    ALTER TABLE kcl_season_rankings
    ADD CONSTRAINT kcl_season_rankings_year_month_company_unique
    UNIQUE (year, month, company_id);
  END IF;
END $$;

-- ============================================================
-- 2. Fixed function with advisory lock + current-month check
-- ============================================================
CREATE OR REPLACE FUNCTION public.snapshot_season_rankings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year    int;
  v_month   int;
  v_count   int;
BEGIN
  -- Acquire transaction-scoped advisory lock so concurrent calls serialize.
  -- Duplicate inserts are still blocked by the UNIQUE constraint, but the
  -- lock prevents unnecessary work and avoids constraint-error noise.
  PERFORM pg_advisory_xact_lock(hashtext('snapshot_season_rankings'));

  -- Target: current month based on DATE_TRUNC('month', NOW())
  -- Previously used previous month (NOW() - INTERVAL '1 month'), which caused
  -- mid-month manual runs to skip because prev-month snapshot already existed.
  v_year  := EXTRACT(YEAR  FROM DATE_TRUNC('month', NOW()))::int;
  v_month := EXTRACT(MONTH FROM DATE_TRUNC('month', NOW()))::int;

  -- Skip only if snapshot for THIS month already exists
  SELECT COUNT(*) INTO v_count
  FROM kcl_season_rankings
  WHERE year = v_year AND month = v_month;

  IF v_count > 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'year', v_year,
      'month', v_month,
      'message', 'Snapshot already exists for this month',
      'existing_count', v_count
    );
  END IF;

  -- Insert snapshot: current firepower + global rank per company
  -- Ties share the same rank (RANK(), not ROW_NUMBER())
  INSERT INTO kcl_season_rankings (year, month, company_id, rank, league_tier, firepower)
  SELECT
    v_year,
    v_month,
    c.id,
    RANK() OVER (ORDER BY c.firepower DESC) AS rank,
    c.league_tier,
    c.firepower
  FROM kcl_companies c
  WHERE c.deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'year', v_year,
    'month', v_month,
    'message', 'Snapshot saved',
    'saved_count', v_count
  );
END;
$$;
