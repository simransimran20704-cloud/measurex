# MEASUREX – CLOUD FIRESTORE DATABASE SCHEMA (PHASE 5)
**Document Version:** 1.0.0  
**Target Database:** Google Cloud Firestore (Native Mode)  
**Security Model:** User-Isolated Subcollections + Server-Managed System Collections  

---

## 1. Schema Overview

MeasureX structures data to guarantee **strict tenant isolation by default**. User-owned confidential assets (measurement projects, geometric vectors, instrument histories, calibration profiles) are placed under user subcollections (`/users/{userId}/**`). System-critical records (subscriptions, payment webhook idempotency ledgers, audit logs) reside in top-level collections restricted to server-side Cloud Functions execution.

```
/users/{userId}                         <-- User profile & settings
    /projects/{projectId}               <-- CAD drawings, shapes, canvas state
    /measurements/{measurementId}       <-- Caliper, micrometer, scale readings
    /calibrations/{calibrationId}       <-- Screen DPI profiles (pixels/mm)
    /documents/{documentId}             <-- Image blueprint metadata & storage references
/subscriptions/{subscriptionId}         <-- Server-managed subscription entitlements
/paymentEvents/{eventId}                 <-- Idempotent payment webhook event ledger
/auditLogs/{logId}                       <-- Immutable security and compliance log
/publicConfiguration/{configId}         <-- Client-safe calibration & tool constants
```

---

## 2. Detailed Collection Specifications

### 2.1 Collection: `/users/{userId}`
Stores public profile information, role status, and privacy preferences for an authenticated user.

| Field | Type | Required | Description | Constraint |
|---|---|---|---|---|
| `id` | `string` | Yes | Matching Firebase Auth UID | Must equal `request.auth.uid` |
| `email` | `string` | Yes | Registered email address | Valid email format |
| `displayName` | `string` | Yes | User's full name | Min 2, max 80 chars |
| `role` | `string` | Yes | User role in system | `'user'`, `'engineer'`, `'lab_director'`, `'admin'` |
| `plan` | `string` | Yes | Entitlement tier | `'free'`, `'pro'`, `'enterprise'` |
| `subscriptionStatus`| `string` | Yes | Billing status | `'active'`, `'trialing'`, `'past_due'`, `'canceled'` |
| `currentPeriodEnd` | `timestamp`| Yes | Subscription expiry | ISO timestamp |
| `createdAt` | `timestamp`| Yes | Account creation date | Server timestamp |
| `updatedAt` | `timestamp`| Yes | Profile last modified | Server timestamp |
| `privacyConsent` | `map` | Yes | GDPR/DPDP consent flags | `{ analytics: boolean, cloudSync: boolean, exportConsent: boolean }` |

> [!IMPORTANT]
> The fields `role`, `plan`, `subscriptionStatus`, and `currentPeriodEnd` are **server-write-only**. Security rules strictly forbid client requests from updating these fields to prevent privilege escalation.

---

### 2.2 Subcollection: `/users/{userId}/projects/{projectId}`
Contains engineering measurement projects, geometric vectors, coordinate origin, and annotations.

| Field | Type | Required | Description | Constraint |
|---|---|---|---|---|
| `id` | `string` | Yes | Project unique identifier | e.g. `proj_2026_x89a` |
| `ownerId` | `string` | Yes | Matching parent `{userId}` | Must equal `request.auth.uid` |
| `title` | `string` | Yes | Project title | Min 1, max 120 chars |
| `type` | `string` | Yes | Workspace category | `'Precision Studio'`, `'Instruments'`, `'Workspace'` |
| `description` | `string` | No | Engineering notes | Max 1,000 chars |
| `shapes` | `array<map>`| Yes | Plotted geometric vectors | Lines, rectangles, circles, angles, polygons |
| `coordinateOrigin` | `map` | Yes | Canvas origin (X, Y) | `{ x: number, y: number }` |
| `canvasZoom` | `number` | Yes | Magnification level | Range: `0.1` to `10.0` |
| `activeUnit` | `string` | Yes | Dimension unit | `'mm'`, `'cm'`, `'m'`, `'in'`, `'ft'` |
| `isArchived` | `boolean`| Yes | Soft-delete status | Default: `false` |
| `lastModified` | `timestamp`| Yes | Modification timestamp | Server timestamp |
| `createdAt` | `timestamp`| Yes | Creation timestamp | Server timestamp |

---

### 2.3 Subcollection: `/users/{userId}/measurements/{measurementId}`
Stores historical measurement entries captured from digital instruments (Caliper, Micrometer, Height Gauge, DTI, Protractor, Scale).

| Field | Type | Required | Description | Constraint |
|---|---|---|---|---|
| `id` | `string` | Yes | Measurement record ID | Unique string |
| `ownerId` | `string` | Yes | Matching parent `{userId}` | Must equal `request.auth.uid` |
| `tool` | `string` | Yes | Instrument type | e.g. `'Vernier Caliper'`, `'Screw Gauge'` |
| `title` | `string` | Yes | Measurement label | Max 100 chars |
| `value` | `string` | Yes | Formatted reading | e.g. `'24.700 mm'` |
| `rawNumericValue` | `number` | Yes | Exact numeric scalar | Floating point |
| `unit` | `string` | Yes | Physical unit | `'mm'`, `'in'`, `'g'`, `'°'`, `'µm'` |
| `details` | `string` | No | Zero error, MSR, VSR breakdown | Max 500 chars |
| `timestamp` | `timestamp`| Yes | Timestamp captured | Server timestamp |

---

### 2.4 Subcollection: `/users/{userId}/calibrations/{calibrationId}`
Stores hardware display calibration profiles (credit card, coin, manual DPI).

| Field | Type | Required | Description | Constraint |
|---|---|---|---|---|
| `id` | `string` | Yes | Profile identifier | e.g. `'default'`, `'external_4k'` |
| `ownerId` | `string` | Yes | Matching parent `{userId}` | Must equal `request.auth.uid` |
| `name` | `string` | Yes | Display device label | Max 60 chars |
| `pixelsPerMm` | `number` | Yes | Physical screen scale | Range: `1.0` to `50.0` |
| `dpr` | `number` | Yes | Device Pixel Ratio | Range: `1.0` to `5.0` |
| `method` | `string` | Yes | Calibration technique | `'credit-card'`, `'coin'`, `'manual-ruler'` |
| `isCalibrated` | `boolean`| Yes | Calibration status | Boolean |
| `calibratedAt` | `timestamp`| Yes | Verification date | Server timestamp |

---

### 2.5 Collection: `/subscriptions/{subscriptionId}`
Managed exclusively by Cloud Functions following payment gateway webhook verification.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Gateway subscription ID (e.g. `sub_1O...`) |
| `userId` | `string` | Yes | MeasureX user UID |
| `customerEmail` | `string` | Yes | Billing email |
| `plan` | `string` | Yes | `'pro'`, `'enterprise'` |
| `status` | `string` | Yes | `'active'`, `'past_due'`, `'canceled'`, `'unpaid'` |
| `billingCycle` | `string` | Yes | `'annual'`, `'monthly'` |
| `amount` | `number` | Yes | Billed amount in USD |
| `currentPeriodStart`| `timestamp`| Yes | Billing cycle start |
| `currentPeriodEnd` | `timestamp`| Yes | Billing cycle renewal / expiry |
| `cancelAtPeriodEnd` | `boolean`| Yes | If auto-renewal is canceled |
| `gateway` | `string` | Yes | `'stripe'`, `'razorpay'` |
| `createdAt` | `timestamp`| Yes | Creation timestamp |
| `updatedAt` | `timestamp`| Yes | Last webhook update |

---

### 2.6 Collection: `/paymentEvents/{eventId}`
Idempotency ledger for incoming payment webhooks to protect against replay attacks and duplicate activations.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Gateway Event ID (e.g. `evt_3M...`) |
| `eventType` | `string` | Yes | e.g. `'customer.subscription.updated'` |
| `gateway` | `string` | Yes | `'stripe'`, `'razorpay'` |
| `processedAt` | `timestamp`| Yes | Processing timestamp |
| `status` | `string` | Yes | `'processed'`, `'ignored'`, `'failed'` |
| `error` | `string` | No | Failure details if encountered |

---

### 2.7 Collection: `/auditLogs/{logId}`
Append-only immutable audit trail for compliance, security investigation, and SOC 2 audits.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique log entry ID |
| `actorId` | `string` | Yes | UID of actor or `'system'` |
| `actorEmail` | `string` | Yes | Email of actor |
| `action` | `string` | Yes | e.g. `'AUTH_LOGIN'`, `'PROJECT_DELETED'`, `'PLAN_UPGRADE'` |
| `resourcePath` | `string` | Yes | Targeted document path |
| `ipHash` | `string` | Yes | One-way SHA-256 salted hash of client IP |
| `userAgent` | `string` | Yes | Client browser / device user agent |
| `status` | `string` | Yes | `'SUCCESS'`, `'DENIED'`, `'FAILED'` |
| `timestamp` | `timestamp`| Yes | Exact UTC server timestamp |

---

## 3. Indexing & Query Optimization Strategy

### Composite Indexes Required:
1. `users/{userId}/projects`: `isArchived ASC, lastModified DESC` (for fast project listing).
2. `users/{userId}/measurements`: `tool ASC, timestamp DESC` (for filtering measurements by instrument).
3. `subscriptions`: `userId ASC, status ASC` (for fast entitlement verification).
4. `auditLogs`: `actorId ASC, timestamp DESC` (for compliance activity reviews).
