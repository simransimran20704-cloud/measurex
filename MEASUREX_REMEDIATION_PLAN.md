# MEASUREX SECURITY REMEDIATION PLAN (CLOUDFLARE EDGE STACK)
**Document Version:** 1.0.0  
**Classification:** Confidential – Engineering Remediation Roadmap  
**Target Platform:** MeasureX Universal Metrology Platform  
**Target Infrastructure:** Cloudflare Pages (Frontend) + Cloudflare Workers (API) + Cloudflare D1 (SQL) + Cloudflare R2 (Storage)  

---

## 1. Remediation Objectives & Guarantees

This document establishes the step-by-step engineering plan to remediate all 12 vulnerabilities identified in [`MEASUREX_SECURITY_AUDIT.md`](file:///c:/Users/Simran/MeasureX/MEASUREX_SECURITY_AUDIT.md).

### Non-Destructive Principles:
1. **Preserve All 15 Metrology Instruments:** The mathematical precision engines (Vernier caliper, micrometer, dial indicator, height gauge, protractor, precision scale, etc.) will not be touched or altered.
2. **Preserve Light Aurora Design System:** The visual styling, magnetic card interactions, sound effects, and canvas rendering remain 100% identical.
3. **Graceful Fallback Mode:** The frontend client will support an offline/demo fallback mode so that if network connectivity is absent, local measurement tools function seamlessly.
4. **Zero Downtime Migration:** Database migrations and API integration will occur in staged phases without breaking existing unit tests.

```
+----------------------------------------------------------------------------------------------------+
|                                    6-PHASE REMEDIATION ROADMAP                                     |
+----------------------------------------------------------------------------------------------------+
| PHASE 1: API CLIENT ABSTRACTION LAYER       Abstract storage calls behind type-safe API services   |
| PHASE 2: CLOUDFLARE WORKERS API BACKEND     Hono REST API on global edge runtime (<15ms latency)   |
| PHASE 3: CLOUDFLARE D1 DATABASE SETUP       Normalized SQLite relational schema & migrations       |
| PHASE 4: CLOUDFLARE R2 PRIVATE VAULT        Zero-egress private document storage & signed URLs     |
| PHASE 5: SERVER-AUTHORITATIVE PAYMENTS      Stripe official API + HMAC webhook signature ledger    |
| PHASE 6: EDGE HARDENING & AUDIT TESTS       CSP _headers, Cloudflare Turnstile, Rate limiters      |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Phase 1: Storage Deprecation & API Client Abstraction

Currently, stores (`authStore.ts`, `projectStore.ts`, `historyStore.ts`) directly call `localStorage.getItem` and `localStorage.setItem`.

### 2.1 Action Items:
* Create a centralized API client module: `src/services/api.ts`.
* Introduce an environment-aware transport:
  - In **Production/Cloud Mode**, all authentication, projects, and subscription calls issue `fetch('/api/...')` requests with credentials.
  - In **Local/Demo Mode**, the client gracefully operates with in-memory or demo fallback for rapid development and offline demonstrations.
* Encapsulate token handling inside `HttpOnly` Secure cookies so that JavaScript cannot access session tokens directly (mitigating XSS credential harvesting).

```typescript
// src/services/api.ts
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Includes HttpOnly session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}
```

---

## 3. Phase 2: Cloudflare Workers Backend API Implementation

Cloudflare Pages natively supports serverless backend functions located in the `functions/` directory or deployed as a dedicated Cloudflare Worker service.

### 3.1 Technology Choice: Hono Web Framework
* **Why Hono?** Extremely lightweight (< 14KB), zero-dependency, ultrafast routing built specifically for Cloudflare Workers, D1, and R2.
* Provides built-in middleware for:
  - CORS with strict origin validation
  - CSRF protection
  - Secure Cookie handling
  - Request rate limiting
  - Zod request body validation

### 3.2 Worker Route Structure:
```
functions/api/
├── [[route]].ts                <-- Main Hono application router
├── auth/
│   ├── register.ts             <-- POST /api/auth/register
│   ├── login.ts                <-- POST /api/auth/login
│   ├── logout.ts               <-- POST /api/auth/logout
│   ├── me.ts                   <-- GET /api/auth/me
│   └── password-reset.ts       <-- POST /api/auth/forgot-password, /reset-password
├── projects/
│   ├── index.ts                <-- GET, POST /api/projects
│   └── [id].ts                 <-- GET, PUT, DELETE /api/projects/:id
├── measurements/
│   └── index.ts                <-- GET, POST /api/measurements
├── storage/
│   ├── upload-url.ts           <-- POST /api/storage/upload-url (R2 Signed URL)
│   └── file.ts                 <-- GET /api/storage/file/:fileId
└── payments/
    ├── checkout.ts             <-- POST /api/payments/create-checkout-session
    └── webhook.ts              <-- POST /api/payments/webhook (Stripe HMAC)
```

---

## 4. Phase 3: Cloudflare D1 Database Provisioning

Cloudflare D1 is an edge-native serverless SQL database built on SQLite with automatic replication.

### 4.1 Provisioning Steps via Wrangler CLI:
```bash
# 1. Create D1 database instance
npx wrangler d1 create measurex-db

# 2. Bind database in wrangler.toml
# [[d1_databases]]
# binding = "DB"
# database_name = "measurex-db"
# database_id = "<auto-generated-guid>"

# 3. Apply schema migrations
npx wrangler d1 execute measurex-db --local --file=./migrations/0001_initial_schema.sql
npx wrangler d1 execute measurex-db --remote --file=./migrations/0001_initial_schema.sql
```

### 4.2 Security Controls:
* Parameterized queries mandatory (`env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first()`).
* Zero raw string concatenation in SQL queries (100% SQL injection prevention).

---

## 5. Phase 4: Cloudflare R2 Private Document Storage

Cloudflare R2 provides zero-egress fee private S3-compatible object storage.

### 5.1 Storage Architecture:
* **Bucket Name:** `measurex-documents-prod`
* **Access Control:** Public access disabled.
* **Storage Key Format:** `users/{userId}/blueprints/{fileId}.{ext}`
* **Workflow:**
  1. Frontend sends file metadata (MIME type, size, filename) to `POST /api/storage/upload-url`.
  2. Worker verifies user session and checks user storage quota based on their subscription tier (Free: 25MB, Pro: 2GB, Enterprise: 25GB).
  3. Worker verifies MIME type is in the approved whitelist (`image/png`, `image/jpeg`, `image/webp`, `application/pdf`, `image/svg+xml`).
  4. Worker generates a temporary signed PUT URL valid for 10 minutes.
  5. Frontend uploads file directly to R2 without routing heavy binaries through the Worker CPU.
  6. To retrieve files, Worker verifies project ownership before issuing a short-lived signed GET URL (valid for 15 minutes).

---

## 6. Phase 5: Server-Authoritative Stripe Payment Integration

### 6.1 Payment Architecture:
```
[Browser] -----------> 1. POST /api/payments/create-checkout-session
                            |
                            |-- Worker creates Stripe Checkout Session
                            v
[Browser] <----------- 2. Returns Stripe Checkout URL (external redirect)
    |
    |-- User completes payment on checkout.stripe.com
    v
[Stripe Edge] -------> 3. POST /api/payments/webhook (Cryptographically signed)
                            |
                            |-- Worker verifies Stripe-Signature header using Secret Manager key
                            |-- Checks payment_events table for idempotency (anti-replay)
                            |-- Atomically updates user subscription tier to 'pro' / 'enterprise'
                            v
                       4. HTTP 200 OK
```

### 6.2 Key Security Measures:
* Webhook secret stored securely in Cloudflare Worker encrypted secrets (`wrangler secret put STRIPE_WEBHOOK_SECRET`).
* Cardholder data (PAN, CVV, Expiry) never touches MeasureX servers (PCI-DSS SAQ-A compliance).
* Instant automatic downgrade upon cancellation or dispute.

---

## 7. Phase 6: Edge Security Hardening & Headers

### 7.1 Cloudflare Pages `_headers` File:
A production `_headers` file placed in the `public/` directory will enforce strict browser security:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com https://checkout.stripe.com;
```

### 7.2 Bot Mitigation:
* Cloudflare Turnstile integrated on `/api/auth/register` and `/api/auth/forgot-password` to stop automated credential stuffing.

---

## 8. Rollback & Migration Safety Plan

* **Backup First:** Existing demo datasets in `src/stores/authStore.ts` and `src/stores/projectStore.ts` remain available as seeds in `migrations/0002_seed_data.sql`.
* **Zero Disruption to Local Tests:** Vitest test suites will test both the pure metrology math and the API service mock without requiring live cloud connections during continuous integration.
* **Approval Checkpoint:** No code or infrastructure deployments will occur without explicit user confirmation.
