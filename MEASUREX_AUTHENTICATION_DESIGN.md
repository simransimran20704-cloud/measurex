# MEASUREX EDGE AUTHENTICATION & AUTHORIZATION DESIGN
**Document Version:** 2.0.0 (Cloudflare Edge Architecture)  
**Classification:** Confidential – Security Engineering  
**Platform:** Cloudflare Workers + Web Crypto API + Cloudflare D1  

---

## 1. Authentication Architecture Overview

MeasureX enforces a **Zero-Trust, Server-Authoritative Authentication Model** executed entirely at Cloudflare's global edge.

```
+----------------------------------------------------------------------------------------------------+
|                                  EDGE AUTHENTICATION ARCHITECTURE                                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [Client Browser]                                                                                  |
|         |                                                                                          |
|         |-- 1. POST /api/auth/login { email, password }                                            |
|         v                                                                                          |
|  [Cloudflare Edge Worker]                                                                          |
|         |-- 2. Rate-Limit Check (Max 5 attempts / 15m per IP & Account)                            |
|         |-- 3. Query D1 users: SELECT * FROM users WHERE email = ?                                 |
|         |-- 4. Derive Hash via Web Crypto PBKDF2 (600,000 rounds) / Argon2id                       |
|         |-- 5. Constant-Time Timing-Safe Equality Comparison                                       |
|         |-- 6. Generate 256-bit Cryptographic Session Token (rawToken)                             |
|         |-- 7. Hash Token (SHA-256) -> Store in D1 sessions table (expires in 7 days)             |
|         v                                                                                          |
|  [Client Browser] <==== 8. Set-Cookie: __Host-mx_session=<rawToken>; HttpOnly; Secure; SameSite=Lax |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Password Hashing Specification (Web Crypto API)

Because Cloudflare Workers execute in a V8 isolate without native Node.js C++ bindings, password hashing is executed using the standard **W3C Web Crypto API** (PBKDF2 with SHA-256 and 600,000 iterations) or WebAssembly Argon2id.

### 2.1 Hashing Implementation in Worker:
```typescript
/**
 * Generates a PBKDF2-SHA256 password hash using standard Web Crypto API
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const saltBytes = crypto.getRandomValues(new Uint8Array(32));
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 600000, // OWASP 2026 Recommended Minimum
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const hash = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash, salt };
}

/**
 * Constant-Time Password Verification to prevent timing attacks
 */
export async function verifyPassword(password: string, storedHash: string, saltHex: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const computedHash = Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time string comparison
  if (computedHash.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}
```

---

## 3. Session Security & Cookie Protection

### 3.1 Cookie Attributes:
* **Name:** `__Host-mx_session` (The `__Host-` prefix guarantees the cookie is only sent to the exact domain, requires HTTPS, and cannot be modified by subdomains).
* **`HttpOnly`:** True (Completely inaccessible to `document.cookie` or JavaScript; zero XSS token exfiltration).
* **`Secure`:** True (Only transits over HTTPS).
* **`SameSite`:** `Lax` (Prevents Cross-Site Request Forgery / CSRF while supporting standard navigation).
* **`Path`:** `/`
* **`Max-Age`:** `604800` (7 days rolling expiration).

### 3.2 Token Hashing in Database:
To prevent database breach dumps from exposing valid session tokens:
* The browser receives the raw 256-bit token.
* The D1 `sessions` table only stores the **SHA-256 hash** of the token.
* Even if an attacker gains read access to the D1 database, they cannot forge or hijack active user sessions.

---

## 4. Server-Side Authorization Middleware (Hono)

Every protected route executes the `requireAuth` middleware before business logic.

```typescript
import { Context, Next } from 'hono';

export interface UserContext {
  id: string;
  email: string;
  role: 'user' | 'metrologist' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
}

export async function requireAuth(c: Context, next: Next) {
  const sessionCookie = c.req.cookie('__Host-mx_session');

  if (!sessionCookie) {
    return c.json({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  // Hash incoming cookie token to compare with database
  const tokenHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionCookie));
  const tokenHash = Array.from(new Uint8Array(tokenHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Query D1 sessions joined with users
  const sessionRecord = await c.env.DB.prepare(
    `SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.role, u.plan
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.session_token_hash = ? AND s.expires_at > unixepoch()`
  ).bind(tokenHash).first();

  if (!sessionRecord) {
    // Clear invalid or expired cookie
    c.header('Set-Cookie', '__Host-mx_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
    return c.json({ error: 'SESSION_EXPIRED', message: 'Session is invalid or expired. Please sign in.' }, 401);
  }

  // Set user context for downstream handlers
  c.set('user', {
    id: sessionRecord.user_id,
    email: sessionRecord.email,
    role: sessionRecord.role,
    plan: sessionRecord.plan,
  });

  await next();
}
```

---

## 5. Ownership Verification & Anti-IDOR Guard

```typescript
/**
 * Enforces that a resource (project, calibration, measurement) belongs strictly to the requesting user
 */
export async function requireResourceOwnership(c: Context, table: 'projects' | 'measurements', resourceId: string): Promise<boolean> {
  const user = c.get('user') as UserContext;

  const record = await c.env.DB.prepare(
    `SELECT id, user_id FROM ${table} WHERE id = ? AND is_deleted = 0`
  ).bind(resourceId).first();

  if (!record) {
    return false; // 404 Not Found
  }

  // Admin override or exact owner match
  if (record.user_id !== user.id && user.role !== 'admin') {
    // Log IDOR probe to audit_logs
    await c.env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata) VALUES (?, ?, 'IDOR_PROBE', 'CRITICAL', ?)`
    ).bind(crypto.randomUUID(), user.id, JSON.stringify({ targetTable: table, targetId: resourceId })).run();

    return false; // 403 Forbidden
  }

  return true;
}
```

---

## 6. Secure Password Reset Workflow

1. User requests password reset via `POST /api/auth/forgot-password { email }`.
2. Worker verifies user exists, generates a 32-byte cryptographically random token (`rawResetToken`), hashes it with SHA-256, and stores it in `password_resets` with `expires_at = unixepoch() + 900` (15 minutes).
3. Worker sends an email containing the reset URL: `https://measurex.app/reset-password?token=<rawResetToken>`.
4. User enters new password on the secure reset page (`POST /api/auth/reset-password`).
5. Worker verifies token freshness, ensures `used_at IS NULL`, updates `password_hash` in `users`, marks token as consumed (`used_at = unixepoch()`), and invalidates all existing sessions in `sessions` table.
