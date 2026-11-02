# MEASUREX CLOUDFLARE EDGE CLOUD ARCHITECTURE SPECIFICATION
**Document Version:** 2.0.0 (Cloudflare Edge Platform)  
**Classification:** Confidential – Platform Architecture  
**Target Infrastructure:** Cloudflare Global Edge Network  

---

## 1. System Topology Overview

MeasureX is architected on Cloudflare's serverless edge infrastructure to provide global low-latency metrology processing (< 15ms globally), zero-egress document storage, and enterprise-grade data isolation.

```
+----------------------------------------------------------------------------------------------------+
|                                    MEASUREX CLOUDFLARE TOPOLOGY                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|    [Client Browser]                                                                                |
|           |                                                                                        |
|           |-- HTTPS / TLS 1.3 (Strict HSTS)                                                        |
|           v                                                                                        |
|    [Cloudflare Edge Network & WAF]                                                                 |
|           |-- DDoS Protection & Anycast CDN                                                        |
|           |-- Cloudflare Turnstile Bot Defense                                                     |
|           |-- Strict Security Headers (CSP, HSTS, X-Frame-Options: DENY)                           |
|           |                                                                                        |
|           +---------------------------------------+                                                |
|           | (Static Assets)                       | (API Requests: /api/*)                         |
|           v                                       v                                                |
|    [Cloudflare Pages]                      [Cloudflare Workers API]                                |
|    - Vite + React 18 SPA                   - Hono Framework Router                                 |
|    - Tailwind CSS Assets                   - Web Crypto Argon2id / PBKDF2 Password Hashing         |
|    - Light Aurora UI                       - HttpOnly Secure Cookie Session Manager                |
|    - Precision Canvas Engine               - Server-Side Role & Plan Authorization Guard           |
|                                            - Stripe HMAC-SHA256 Webhook Engine                     |
|                                                   |                                                |
|                        +--------------------------+--------------------------+                     |
|                        |                                                     |                     |
|                        v                                                     v                     |
|             [Cloudflare D1 Database]                              [Cloudflare R2 Storage]          |
|             - Serverless Edge SQL (SQLite)                        - S3-Compatible Private Vault    |
|             - Users & Sessions Tables                             - Technical CAD Blueprints       |
|             - Projects & Measurements                             - Calibration Certifications     |
|             - Subscriptions & Invoices                            - PDF Audit Reports              |
|             - Replay-Protected Payment Events                     - Zero Egress Fees               |
|             - Parameterized SQL Prepared Queries                  - Pre-Signed 15m Access URLs     |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 Frontend Tier: Cloudflare Pages
* **Role:** Static asset delivery and edge routing.
* **Build Integration:**
  - Automated deployment via Git push to GitHub repository `measurex`.
  - Build command: `npm run build` (`tsc && vite build`).
  - Output directory: `dist`.
* **Caching & CDN:**
  - Immutable static assets (`dist/assets/*.js`, `dist/assets/*.css`) cached at edge with `Cache-Control: public, max-age=31536000, immutable`.
  - `index.html` cached with `Cache-Control: public, max-age=0, must-revalidate` to ensure immediate rollouts of new frontend releases.

### 2.2 Backend Tier: Cloudflare Workers
* **Role:** Authoritative serverless API running across 300+ edge data centers.
* **Technology:** Hono Web Framework + Web Crypto API + TypeScript.
* **Resource Bindings in `wrangler.toml`:**
  ```toml
  name = "measurex-api"
  main = "src/worker/index.ts"
  compatibility_date = "2024-04-01"

  # Cloudflare D1 Relational Database Binding
  [[d1_databases]]
  binding = "DB"
  database_name = "measurex-db"
  database_id = "d1-measurex-prod-guid"

  # Cloudflare R2 Private Storage Bucket Binding
  [[r2_buckets]]
  binding = "DOCUMENTS_VAULT"
  bucket_name = "measurex-documents-prod"

  # Cloudflare Workers KV (Fast Session & Rate-Limit Cache)
  [[kv_namespaces]]
  binding = "SESSION_CACHE"
  id = "kv-measurex-sessions-guid"
  ```

### 2.3 Database Tier: Cloudflare D1
* **Role:** High-performance, low-latency relational SQL datastore.
* **Replication:** Primary edge instance with read replication to edge regions nearest the active user.
* **Safety & Transactions:** Supports atomic ACID transactions (`db.batch([stmt1, stmt2])`) ensuring consistency across multi-document updates (e.g., project creation and measurement counters).

### 2.4 Document Storage Tier: Cloudflare R2
* **Role:** Secure, private cloud vault for customer engineering blueprints, vector files, and PDF invoices.
* **Security Attributes:**
  - **Zero Public Access:** Direct internet access to the bucket is completely disabled.
  - **Ephemeral Access:** Workers issue short-lived V4 Pre-Signed URLs (valid for 15 minutes) only after authenticating user ownership.
  - **Zero Egress Tax:** Eliminates egress bandwidth costs standard in AWS S3 or GCP.

---

## 3. Environment Isolation & Pipeline Strategy

```
+----------------------------------------------------------------------------------------------------+
|  ENVIRONMENT          PAGES BRANCH          D1 DATABASE INSTANCE       R2 BUCKET NAME              |
+----------------------------------------------------------------------------------------------------+
|  Development (Local)  Localhost:3000        Local Miniflare SQLite     Local In-Memory / Dev R2    |
|  Staging              branch: staging       measurex-db-staging        measurex-docs-staging       |
|  Production           branch: main          measurex-db-prod           measurex-documents-prod     |
+----------------------------------------------------------------------------------------------------+
```

### Secret Management Policy:
* Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`) are **NEVER committed to git**.
* Stored exclusively via Cloudflare encrypted secrets:
  ```bash
  npx wrangler secret put STRIPE_SECRET_KEY --env production
  npx wrangler secret put STRIPE_WEBHOOK_SECRET --env production
  npx wrangler secret put SESSION_SECRET --env production
  ```

---

## 4. Disaster Recovery & Edge Redundancy

1. **Automated D1 Time Travel (PITR):** Cloudflare D1 automatically retains a 30-day point-in-time recovery window. If accidental data corruption or rogue SQL execution occurs, the database can be restored to any minute within the past 30 days:
   ```bash
   npx wrangler d1 time-travel restore measurex-db --timestamp="2026-11-02T14:00:00Z"
   ```
2. **Cloudflare Global Anycast:** Automated regional failover. If an edge location experiences infrastructure disruption, client DNS routes to the nearest adjacent data center automatically with zero downtime.
