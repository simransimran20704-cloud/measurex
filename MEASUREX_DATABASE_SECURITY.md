# MEASUREX DATABASE SECURITY & INTEGRITY SPECIFICATION
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Metrology Platform Engineering  
**Scope:** Cloud Firestore Data Isolation, Injection Defense, Security Rules, Admin SDK Boundary, and Integrity Verification  

---

## 1. Executive Summary

MeasureX stores critical metrological calibrations, point-coordinate datasets, precision vector drawings, and customer profile configurations. Because Firestore is a cloud-native NoSQL document database directly accessible by frontend clients, robust database security cannot rely on "trusting the client".

This specification defines the multi-tenant isolation architecture, declarative security rules, injection defense mechanisms, atomic transaction policies, and administrative boundary controls governing all MeasureX datastores.

---

## 2. Multi-Tenant Isolation Architecture

To make cross-tenant data leakage mathematically impossible at the database query layer, MeasureX strictly separates user-private records into user-owned document subtrees:

```
/ (Firestore Root)
├── users/{uid}                         <-- User Root Document
│   ├── projects/{projectId}            <-- Private technical drawings & CAD canvases
│   ├── measurements/{measurementId}    <-- Caliper, micrometer, ruler log records
│   ├── calibrations/{calibrationId}    <-- Device display PPI, physical reference standards
│   ├── subscription/current            <-- Authoritative subscription plan & limits
│   └── settings/preferences            <-- UI theme, units (metric/imperial), snap grids
├── auditLogs/{logId}                   <-- Write-only append ledger for security monitoring
├── paymentEvents/{eventId}             <-- Idempotent webhook tracking records
└── publicConfiguration/{configId}      <-- Read-only system defaults (unit ratios, constants)
```

### Architectural Guarantees:
1. **No Shared Project Tables:** No top-level `/projects` collection with `userId` query filtering. This prevents query bugs or missing `where('userId', '==', uid)` filters from accidentally returning other users' sensitive technical drawings.
2. **Path-Based Authorization:** Firestore security rules bind read/write access directly to the document path variable `{uid}` matching `request.auth.uid`.

---

## 3. SQL & NoSQL Injection Defense

While Firestore is a NoSQL document database immune to standard SQL injection (`' OR '1'='1`), it is susceptible to NoSQL object injection, prototype pollution, and wildcard filter misuse if client payloads are passed unvalidated to database SDK queries.

### 3.1 Defense-in-Depth Mechanisms:
1. **Type-Safe Schema Validation with Zod:** Every write payload is validated against strict Zod schemas before being passed to Firestore. Unexpected keys (e.g., `__proto__`, `$where`, `$regex`, `constructor`) are stripped and rejected.
2. **No Dynamic Query Building from Raw Request Objects:** All query filters utilize static, parameterized field names:
   ```typescript
   // INSECURE (VULNERABLE TO FILTER INJECTION):
   // db.collection('projects').where(req.query.field, '==', req.query.val);

   // SECURE (PARAMETRIC & TYPE-SAFE):
   const allowedFields = ['category', 'status', 'isArchived'] as const;
   type AllowedFilter = typeof allowedFields[number];

   if (!allowedFields.includes(req.query.field as AllowedFilter)) {
     throw new BadRequestError('Invalid query field');
   }
   const safeValue = String(req.query.val).slice(0, 100); // Strict length limit
   query = query.where(req.query.field, '==', safeValue);
   ```
3. **Array and Map Depth Limits:** Payloads with recursive objects or nesting depths exceeding 5 levels are automatically rejected to prevent algorithmic denial-of-service (ReDoS / JSON bomb attacks).

---

## 4. Complete Firestore Security Rules Specification

These rules are deployed directly to Firebase and enforced in real time on every read and write operation.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper Functions
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }

    function isAdmin() {
      return isAuthenticated() && 
        request.auth.token.admin == true && 
        request.auth.token.email.matches('.*@measurex\\.app$');
    }

    function isValidTimestamp(val) {
      return val is timestamp && val <= request.time;
    }

    // 1. User Profile & Settings
    match /users/{uid} {
      allow read: if isOwner(uid) || isAdmin();
      
      // User can create their initial profile, cannot elevate role or plan
      allow create: if isOwner(uid) &&
        request.resource.data.keys().hasAll(['email', 'createdAt']) &&
        !request.resource.data.keys().hasAny(['role', 'admin', 'plan', 'isPro']) &&
        request.resource.data.email == request.auth.token.email;

      // User cannot modify security-sensitive fields directly
      allow update: if isOwner(uid) &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'admin', 'plan', 'isPro', 'email']);

      allow delete: if isAdmin(); // Self-deletion handled via cloud function with cleanup

      // 2. Private User Projects (Drawings, Precision Canvas)
      match /projects/{projectId} {
        allow read: if isOwner(uid) || isAdmin();
        
        allow create: if isOwner(uid) &&
          request.resource.data.name is string &&
          request.resource.data.name.size() > 0 &&
          request.resource.data.name.size() <= 120 &&
          request.resource.data.createdAt == request.time;

        allow update: if isOwner(uid) &&
          request.resource.data.updatedAt == request.time &&
          request.resource.data.name.size() <= 120;

        allow delete: if isOwner(uid) || isAdmin();
      }

      // 3. Private Measurements & Calibration Records
      match /measurements/{measurementId} {
        allow read, write: if isOwner(uid);
      }

      match /calibrations/{calibrationId} {
        allow read, write: if isOwner(uid);
      }

      // 4. Authoritative Subscription Status (Read-Only to User, Writeable ONLY by Admin/Webhook)
      match /subscription/{docId} {
        allow read: if isOwner(uid) || isAdmin();
        allow write: if false; // Only Cloud Functions using Admin SDK can mutate subscriptions
      }
    }

    // 5. Payment Events (Writeable ONLY via Backend Cloud Functions)
    match /paymentEvents/{eventId} {
      allow read, write: if false; // Zero direct client access
    }

    // 6. Security Audit Logs (Append-Only from Authorized Backend or Client Telemetry with Strict Schema)
    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated() &&
        request.resource.data.actorId == request.auth.uid &&
        request.resource.data.timestamp == request.time &&
        request.resource.data.keys().hasOnly(['actorId', 'timestamp', 'eventType', 'severity', 'userAgent']);
      allow update, delete: if false; // Immutable audit trail
    }

    // 7. Public Configuration (Read-Only)
    match /publicConfiguration/{configId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 5. Server-Side Admin SDK Boundary

To avoid over-privileged microservices, backend tasks and Cloud Functions operate under principle of least privilege:

```
+-------------------------------------------------------------------------------+
|                      ADMIN SDK SERVICE ACCOUNT POLICIES                        |
+-------------------------------------------------------------------------------+
| Service Account: measurex-api@measurex-prod.iam.gserviceaccount.com           |
| Roles Granted:                                                                |
|   - roles/datastore.user (Can query and write data; cannot delete databases)  |
|   - roles/storage.objectAdmin (Scoped strictly to 'measurex-prod-user-vault')  |
|   - roles/secretmanager.secretAccessor (Only for STRIPE_SECRET_KEY)           |
|                                                                               |
| FORBIDDEN ROLES:                                                              |
|   - roles/owner (Disallowed)                                                  |
|   - roles/editor (Disallowed)                                                 |
|   - roles/iam.securityAdmin (Disallowed)                                      |
+-------------------------------------------------------------------------------+
```

---

## 6. Data Integrity & Atomic Transactions

When performing operations affecting multiple records (e.g. creating a project with initial calibrated measurement layers, or billing plan updates), MeasureX uses **Firestore Atomic Transactions**:

```typescript
import { db } from './firebaseAdmin';

export async function createProjectWithInitialCalibration(
  uid: string,
  projectData: any,
  calibrationData: any
) {
  const projectRef = db.collection('users').doc(uid).collection('projects').doc();
  const calibRef = db.collection('users').doc(uid).collection('calibrations').doc();

  return await db.runTransaction(async (transaction) => {
    // 1. Check user plan quota within transaction
    const userSubRef = db.collection('users').doc(uid).collection('subscription').doc('current');
    const subDoc = await transaction.get(userSubRef);
    const plan = subDoc.data()?.plan || 'free';

    if (plan === 'free') {
      const existingProjects = await transaction.get(
        db.collection('users').doc(uid).collection('projects')
      );
      if (existingProjects.size >= 3) {
        throw new Error('QUOTA_EXCEEDED: Free plan limit of 3 projects reached.');
      }
    }

    // 2. Perform atomic dual-writes
    transaction.set(projectRef, {
      ...projectData,
      id: projectRef.id,
      createdAt: new Date(),
    });

    transaction.set(calibRef, {
      ...calibrationData,
      id: calibRef.id,
      projectId: projectRef.id,
      createdAt: new Date(),
    });

    return { projectId: projectRef.id, calibrationId: calibRef.id };
  });
}
```

---

## 7. Continuous Database Monitoring & Alerts

* **Spike Detection:** Cloud Monitoring alerts trigger if read/write operations exceed 200% of historical moving averages within a 5-minute window (indicative of scraper or infinite client loop).
* **Rule Denial Tracking:** Any surge in `PERMISSION_DENIED` errors in Cloud Logging triggers a P2 alert to investigate potential IDOR or credential stuffing probes.
