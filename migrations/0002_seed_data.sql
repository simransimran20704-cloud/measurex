-- ============================================================================
-- MEASUREX PRODUCTION REFERENCE DATA (CLOUDFLARE D1)
-- Migration: 0002_seed_data.sql
-- ============================================================================
-- PRODUCTION SAFETY VERIFICATION:
-- - All demo user accounts, credentials, password hashes and salts REMOVED.
-- - All demo admin/privileged accounts and demo subscriptions REMOVED.
-- - All demo projects REMOVED.
-- - Retains ONLY verified, non-user-specific physical metrology reference data.
-- ============================================================================

-- 1. Standard Physical Metrology Calibration Reference: ISO/IEC 7810 ID-1
-- Verified Reference Standard:
--   - Specification: ISO/IEC 7810 ID-1 (Standard Bank / ID Card)
--   - Standard Length (Width): 85.60 mm (3.370 in)
--   - Standard Height: 53.98 mm (2.125 in)
--   - Standard Thickness: 0.76 mm (0.030 in)
--   - Standard Baseline Display PPI: 96.0 PPI (W3C CSS specification: 1 inch = 96 px)
--   - Nominal Pixel Length: 85.60 mm * (96 px / 25.4 mm) = 323.53 px
INSERT OR IGNORE INTO calibrations (
    id,
    user_id,
    device_label,
    ppi,
    unit,
    standard_name,
    reference_length,
    pixel_length
)
VALUES (
    'calib-ref-iso7810',
    'system_standard',
    'Standard Metrology Display Baseline (96 PPI)',
    96.0,
    'mm',
    'ISO/IEC 7810 ID-1 Credit Card Standard (85.60 mm)',
    85.60,
    323.53
);
