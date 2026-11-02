# MEASUREX RELATIONAL DATABASE SCHEMA SPECIFICATION (CLOUDFLARE D1)
**Document Version:** 2.0.0 (Cloudflare D1 / SQLite)  
**Classification:** Confidential – Database Engineering  
**Target Engine:** Cloudflare D1 Serverless SQL  

---

## 1. Normalized Relational Schema DDL

The following Data Definition Language (DDL) defines the production schema for Cloudflare D1. All foreign keys enforce referential integrity, and indices optimize query performance across edge replicas.

```sql
-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- e.g. 'usr_c8f2a1b9'
    email TEXT UNIQUE NOT NULL COLLATE NOCASE, -- Case-insensitive unique email
    password_hash TEXT NOT NULL,               -- Argon2id or PBKDF2-SHA256 hash string
    salt TEXT NOT NULL,                        -- Cryptographic 32-byte salt (hex/base64)
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'metrologist', 'admin')),
    plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'enterprise')),
    is_email_verified INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 2. SESSIONS TABLE (Server-Side Session Store)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                       -- UUIDv4 session identifier
    user_id TEXT NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 hash of the cookie token
    expires_at INTEGER NOT NULL,               -- Unix timestamp
    ip_hash TEXT,                              -- Anonymized SHA-256 IP hash
    user_agent TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================================
-- 3. PASSWORD RESETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,           -- SHA-256 hash of single-use reset token
    expires_at INTEGER NOT NULL,               -- 15-minute expiration
    used_at INTEGER,                           -- Null until consumed
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);

-- ============================================================================
-- 4. PROJECTS TABLE (CAD Drawings & Metrology Workspaces)
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,                       -- e.g. 'proj_9a7b6c5d'
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Precision Studio', 'Instruments', 'Workspace', 'Blueprint')),
    description TEXT,
    points_count INTEGER NOT NULL DEFAULT 0,
    drawing_data TEXT,                         -- JSON string of vector coordinates/canvas
    r2_blueprint_key TEXT,                     -- Key to associated blueprint in Cloudflare R2
    is_deleted INTEGER NOT NULL DEFAULT 0,     -- Soft delete tombstone
    deleted_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id, is_deleted);

-- ============================================================================
-- 5. MEASUREMENTS TABLE (Granular Instrument Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS measurements (
    id TEXT PRIMARY KEY,                       -- e.g. 'meas_4e3d2c1b'
    user_id TEXT NOT NULL,
    project_id TEXT,
    tool TEXT NOT NULL,                        -- 'Vernier Caliper', 'Screw Gauge', etc.
    title TEXT NOT NULL,
    value TEXT NOT NULL,                       -- Formatted display string, e.g. '24.7 mm'
    raw_numeric_value REAL NOT NULL,           -- Precision float for arithmetic analysis
    unit TEXT NOT NULL,                        -- 'mm', 'cm', 'in', 'um', 'deg', 'g'
    details TEXT,                              -- Scale readings, vernier divisions, zero errors
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_measurements_user ON measurements(user_id, created_at DESC);

-- ============================================================================
-- 6. CALIBRATIONS TABLE (Screen PPI & Standard Reference Standards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS calibrations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    device_label TEXT NOT NULL,                -- e.g. 'Dell UltraSharp 4K'
    ppi REAL NOT NULL,                         -- Calibrated Pixels Per Inch
    unit TEXT NOT NULL DEFAULT 'mm',
    standard_name TEXT,                        -- 'Credit Card', '100mm Reference Bar'
    reference_length REAL,
    pixel_length REAL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_calibrations_user ON calibrations(user_id);

-- ============================================================================
-- 7. SUBSCRIPTIONS TABLE (Authoritative Server-Side Entitlements)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,                       -- Subscription record ID
    user_id TEXT NOT NULL UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start INTEGER,
    current_period_end INTEGER,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- ============================================================================
-- 8. INVOICES TABLE (Legally Compliant Tax Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,                       -- e.g. 'inv_2026_00192'
    user_id TEXT NOT NULL,
    subscription_id TEXT,
    invoice_number TEXT NOT NULL UNIQUE,       -- Sequential legal invoice number
    amount_cents INTEGER NOT NULL,             -- Currency in lowest denomination ($19.00 = 1900)
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT NOT NULL CHECK(billing_cycle IN ('monthly', 'annual')),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    customer_country TEXT NOT NULL,
    gst_number TEXT,
    pdf_r2_key TEXT,                           -- Cloudflare R2 path to generated PDF
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id, created_at DESC);

-- ============================================================================
-- 9. PAYMENT EVENTS TABLE (Idempotency & Replay Attack Defense)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_events (
    event_id TEXT PRIMARY KEY,                 -- Stripe event ID, e.g. 'evt_1Oxxx'
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,                -- SHA-256 hash of payload
    processed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- ============================================================================
-- 10. AUDIT LOGS TABLE (Tamper-Evident Security Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    event_type TEXT NOT NULL,                  -- 'LOGIN_FAILED', 'IDOR_PROBE', 'PLAN_UPGRADE'
    severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'CRITICAL')),
    ip_hash TEXT,
    user_agent TEXT,
    metadata TEXT,                             -- JSON string with contextual attributes
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type, created_at DESC);
```

---

## 2. Parameterized Query Patterns

All queries are executed with bound parameters to guarantee complete immunity to SQL injection.

```typescript
// 1. Fetching user's private projects (IDOR-safe):
const projects = await env.DB.prepare(
  `SELECT id, title, type, description, points_count, updated_at 
   FROM projects 
   WHERE user_id = ? AND is_deleted = 0 
   ORDER BY updated_at DESC`
).bind(userId).all();

// 2. Atomic Payment Webhook Processing with Idempotency Check:
const batchResults = await env.DB.batch([
  // Step A: Record event ID (fails if duplicate event_id already exists)
  env.DB.prepare(
    `INSERT INTO payment_events (event_id, event_type, payload_hash) VALUES (?, ?, ?)`
  ).bind(event.id, event.type, payloadHash),

  // Step B: Update user subscription tier
  env.DB.prepare(
    `UPDATE subscriptions 
     SET plan = ?, status = 'active', updated_at = unixepoch() 
     WHERE user_id = ?`
  ).bind(targetPlan, userId),

  // Step C: Mirror plan update on users table for fast session reads
  env.DB.prepare(
    `UPDATE users SET plan = ?, updated_at = unixepoch() WHERE id = ?`
  ).bind(targetPlan, userId),
]);
```
