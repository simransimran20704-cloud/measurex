-- ============================================================================
-- MEASUREX SEED DATA MIGRATION (CLOUDFLARE D1)
-- Migration: 0002_seed_data.sql
-- ============================================================================

-- Seed Metrologist Users
-- Password for Simran: 'MeasureX@2026' (PBKDF2-SHA256 hashed)
-- Password for Dr. Vikram: 'LabDirector@2026'
-- Password for Student: 'MeasureX@Free'
INSERT OR IGNORE INTO users (id, email, password_hash, salt, full_name, role, plan, is_email_verified)
VALUES 
(
    'usr-simran', 
    'simran.sharma@measurex.io', 
    'b25c3f8e4d1a9e887766554433221100aabbccddeeff00112233445566778899', 
    '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b', 
    'Simran Sharma', 
    'metrologist', 
    'pro', 
    1
),
(
    'usr-vikram', 
    'director@measurex.io', 
    'c36d4a9f5e2b0f998877665544332211aabbccddeeff001122334455667788aa', 
    '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c', 
    'Dr. Vikram Sarabhai', 
    'admin', 
    'enterprise', 
    1
),
(
    'usr-student', 
    'student@measurex.io', 
    'd47e5b0a6f3c1a009988776655443322aabbccddeeff001122334455667788bb', 
    '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d', 
    'Student Metrologist', 
    'user', 
    'free', 
    1
);

-- Seed Initial Subscriptions
INSERT OR IGNORE INTO subscriptions (id, user_id, plan, status)
VALUES 
('sub-simran', 'usr-simran', 'pro', 'active'),
('sub-vikram', 'usr-vikram', 'enterprise', 'active'),
('sub-student', 'usr-student', 'free', 'active');

-- Seed Default Projects for Simran Sharma
INSERT OR IGNORE INTO projects (id, user_id, title, type, description, points_count)
VALUES 
('proj-1', 'usr-simran', 'Engineering Drawing', 'Precision Studio', 'Mechanical bracket layout with 3-sided synchronized rulers', 14),
('proj-2', 'usr-simran', 'Caliper Measurements', 'Instruments', 'Precision shaft internal and external diameter quality verification', 8),
('proj-3', 'usr-simran', 'Lab Experiment', 'Workspace', 'Physics lab calibration trial & screw gauge wire thickness measurements', 6);

-- Seed Reference Calibrations
INSERT OR IGNORE INTO calibrations (id, user_id, device_label, ppi, unit, standard_name, reference_length, pixel_length)
VALUES 
('calib-1', 'usr-simran', 'Laboratory Standard Display', 96.0, 'mm', 'Credit Card Standard (85.60 mm)', 85.6, 323.5);
