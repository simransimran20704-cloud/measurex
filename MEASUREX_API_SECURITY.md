# MEASUREX API SECURITY & APPLICATION HARDENING SPECIFICATION
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Platform Engineering  
**Scope:** Endpoint Authentication, Rate Limiting, Input Validation, XSS/CSRF/CORS Defenses, HTTP Security Headers, and Quotas  

---

## 1. Executive Summary

The MeasureX API powers all measurement calculations, project persistence, document uploads, calibration syncing, and payment lifecycle events. Because this API handles proprietary CAD coordinates and commercial subscription states, every endpoint must be hardened against abuse, injection, denial-of-service, and cross-origin exploitation.

```
+----------------------------------------------------------------------------------------------------+
|                                     MEASUREX API SECURITY SHIELD                                    |
+----------------------------------------------------------------------------------------------------+
| 1. EDGE PERIMETER      Cloud Armor WAF (Geo-blocking, IP reputation, bot mitigation)               |
| 2. TRANSPORT LAYER     Strict TLS 1.3, HSTS Preload, Automated Managed SSL Certificates             |
| 3. GATEWAY / HEADERS   Strict CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff          |
| 4. ORIGIN ISOLATION    Strict CORS whitelist (https://measurex.app, dev localhost)                |
| 5. RATE LIMITING       Sliding-window Redis/Memory limiter (Auth: 5/min, General API: 120/min)     |
| 6. AUTHENTICATION      Bearer JWT Verification via Firebase Admin SDK (Rejection of unverified)    |
| 7. INPUT VALIDATION    Zod schema validation, stripping unknown keys, length & numeric boundaries  |
| 8. RESOURCE QUOTAS     256 KB JSON body limit, 10 MB file stream cap, timeout after 15s            |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. API Endpoint Authentication & Authorization

All private MeasureX API routes require a valid Firebase ID Token passed in the `Authorization` header:

```http
Authorization: Bearer <firebase_id_token>
```

### 2.1 Enforcement Middleware Implementation
```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    emailVerified: boolean;
    admin: boolean;
    plan: string;
  };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or malformed Authorization header with Bearer token.'
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    // Verify token cryptographic signature, expiration, and check if revoked
    const decodedToken = await auth.verifyIdToken(idToken, true);

    if (!decodedToken.email_verified) {
      return res.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Account email must be verified to access MeasureX API.'
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      emailVerified: decodedToken.email_verified,
      admin: decodedToken.admin === true,
      plan: decodedToken.plan || 'free',
    };

    next();
  } catch (error: any) {
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'TOKEN_REVOKED', message: 'Session has been revoked.' });
    }
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Session expired. Please refresh token.' });
    }
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token verification failed.' });
  }
}
```

---

## 3. Rate Limiting & Denial-of-Service Defense

To prevent brute-force attacks, scraping, and denial-of-service, MeasureX employs multi-tiered rate limiting:

| Endpoint Route | Limit | Window | Action on Violation |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | 5 requests | 15 minutes | HTTP 429 + Progressive delay + Log to `/auditLogs` |
| `/api/auth/register` | 3 requests | 1 hour | HTTP 429 + CAPTCHA challenge |
| `/api/auth/reset-password`| 3 requests | 1 hour | HTTP 429 + Silent discard (prevents email flooding) |
| `/api/payments/checkout` | 5 requests | 10 minutes | HTTP 429 |
| `/api/projects/**` | 120 requests | 1 minute | HTTP 429 (Too Many Requests) |
| `/api/measurements/**` | 300 requests | 1 minute | HTTP 429 |

### 3.1 Rate Limiting Implementation Snippet
```typescript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'API rate limit exceeded. Please throttle your client requests.',
  },
});
```

---

## 4. Input Validation & Schema Enforcement (Zod)

Every incoming API payload must strictly match predefined Zod schemas. Any request containing unverified types, out-of-bound numerical values, or malicious scripting strings is rejected before reaching business logic.

```typescript
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(120, 'Name cannot exceed 120 characters')
    .regex(/^[a-zA-Z0-9_\-\s.]+$/, 'Project name contains illegal characters'),
  description: z.string().max(500).optional(),
  unit: z.enum(['mm', 'cm', 'in', 'px', 'um']),
  scale: z.number().positive().max(100000),
  gridConfig: z.object({
    snapToGrid: z.boolean(),
    spacing: z.number().min(1).max(500),
  }),
}).strict(); // Rejects unknown or extra keys

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'VALIDATION_FAILED',
        details: result.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    req.body = result.data; // Stripped of dangerous unexpected keys
    next();
  };
}
```

---

## 5. Cross-Origin Resource Sharing (CORS) & CSRF Defense

MeasureX explicitly forbids wildcard `Access-Control-Allow-Origin: *` headers on authenticated routes.

### 5.1 Strict CORS Configuration
```typescript
import cors from 'cors';

const allowedOrigins = [
  'https://measurex.app',
  'https://app.measurex.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : [])
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile or health checks) if no origin header present
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by MeasureX CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Client-Version'],
  maxAge: 86400, // 24 hours pre-flight cache
};
```

---

## 6. HTTP Security Headers (`firebase.json`)

To prevent clickjacking, MIME-sniffing, XSS attacks, and unauthorized hardware access (e.g., webcam/microphone when using digital calipers), the following production headers are deployed:

```json
{
  "hosting": {
    "public": "dist",
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains; preload"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "camera=(), microphone=(), geolocation=(), payment=(self 'https://js.stripe.com')"
          },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://api.stripe.com; frame-src https://js.stripe.com https://checkout.stripe.com;"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Request Size & Timeout Quotas

* **JSON Body Quota:** `express.json({ limit: '256kb' })` prevents memory exhaustion attacks via massive strings.
* **Direct File Stream Cap:** Direct uploads via API are capped at `10 MB`. Larger CAD drawings must utilize authenticated Cloud Storage Direct-to-GCS Signed URLs.
* **Request Timeout:** All Cloud Function endpoints timeout after **15 seconds** to prevent slowloris connection starvation.
