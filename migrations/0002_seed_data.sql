-- ============================================================================
-- MEASUREX PRODUCTION REFERENCE DATA (CLOUDFLARE D1)
-- Migration: 0002_seed_data.sql
-- ============================================================================
-- PRODUCTION SAFETY VERIFICATION:
-- 1. All demo user accounts, credentials, password hashes and salts are REMOVED.
-- 2. All demo admin/privileged accounts and demo subscriptions are REMOVED.
-- 3. All demo projects and user-specific calibration records are REMOVED.
-- 4. Global physical metrology reference standards (such as ISO/IEC 7810 ID-1
--    credit cards at 85.60 mm, coins, and gauge blocks) are maintained natively
--    in the application metrology engine at:
--    src/engine/calibration/screenCalibration.ts (STANDARD_OBJECTS).
-- 5. User-specific display calibrations are created dynamically upon user
--    registration via the /api/calibrations endpoint.
-- ============================================================================

-- No-op statement to satisfy migration runners with 100% foreign-key safety:
SELECT 1;
