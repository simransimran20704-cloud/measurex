# MEASUREX – AUTHORIZATION & DATA ISOLATION POLICY
**Document Version:** 1.0.0  
**Security Model:** Attribute-Based Access Control (ABAC) & Resource-Level Ownership  
**Standard:** OWASP Top 10 (A01:2021-Broken Access Control Mitigation)  

---

## 1. Principles of Authorization

1. **Deny by Default**: Access to any resource, collection, document, storage object, or backend function is denied unless explicitly permitted by an authenticated, verified authorization rule.
2. **Server-Side Enforcement**: Frontend routing guards (e.g. `ProtectedRoute` components) exist strictly for user experience. **All authorization decisions are validated and enforced server-side** at the Firestore rules engine, Cloud Storage rules engine, and Cloud Functions API gateway.
3. **Zero Cross-Tenant Access (Strict IDOR Elimination)**: No user, regardless of subscription tier, may query, read, mutate, or delete resources belonging to another user.

---

## 2. Defined Roles & Capabilities Matrix

MeasureX defines 5 strict authorization roles encoded within cryptographic Firebase Custom Claims (`request.auth.token.role` and `request.auth.token.plan`):

| Role | Identifier | Subscription Plan | Storage Quota | Tool & Instrument Access | Cloud Project Sync | Administrative Privileges |
|---|---|---|---|---|---|---|
| **Guest** | `guest` | None | 0 MB (Local only) | Basic Digital Ruler, Unit Converter (Free offline mode) | None (Local in-memory only) | None |
| **Free User** | `free_user` | `free` | 10 MB | 5 basic instruments, Screen Calibration, max 5 saved projects | Local storage only; no cloud sync | None |
| **Premium User** | `premium_user`| `pro` | 5 GB | All 15 Scientific Instruments, 3-Sided Synchronized Studio, PDF Metrology Reports | Unlimited cloud projects & history sync | None |
| **Professional** | `pro_user` | `enterprise` | 50 GB | All instruments, Industrial GD&T Tolerance Engine, CAD DXF Exporter, Multi-Seat Workspace | Unlimited cloud projects, team collaboration | Team Admin (Own organization seats) |
| **Administrator**| `admin` | Internal | N/A | Full platform diagnostic access | Cross-project inspection (Read-only for support) | Full system administration, audit log access |

---

## 3. Resource Ownership Architecture

### 3.1 Subcollection Hierarchical Partitioning
To guarantee mathematical isolation, all user assets exist strictly within the authenticated user's document namespace:

```
/users/{userId}/projects/{projectId}
/users/{userId}/measurements/{measurementId}
/users/{userId}/calibrations/{calibrationId}
/users/{userId}/documents/{documentId}
```

### 3.2 Insecure Direct Object Reference (IDOR) Defense
An IDOR attack occurs when an attacker modifies a parameter (e.g., changing `projectId=101` to `projectId=102`) to view another user's project. In MeasureX:
1. Every query is scoped by the authenticated user's UID (`request.auth.uid`).
2. Even if an attacker knows the exact UUID of another user's project, the Firestore engine evaluates:
   ```javascript
   match /users/{userId}/projects/{projectId} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
   Because `request.auth.uid != userId`, Firestore returns `PERMISSION_DENIED` at the database kernel level before any data is scanned or transmitted.

---

## 4. Anti-Privilege Escalation Specification

Privilege escalation occurs when a user elevates their own permissions (e.g. self-assigning `role: 'admin'` or `plan: 'enterprise'`).

### 4.1 Immutable Protected Fields
The following fields in `/users/{userId}` are designated **server-write-only**:
- `role`
- `plan`
- `subscriptionStatus`
- `currentPeriodEnd`
- `createdAt`

### 4.2 Security Rules Assertion
In `firestore.rules`, any user-initiated profile update is subjected to:
```javascript
function noPrivilegeEscalation() {
  let forbiddenFields = ['role', 'plan', 'subscriptionStatus', 'currentPeriodEnd', 'createdAt'];
  return !request.resource.data.diff(resource.data).affectedKeys().hasAny(forbiddenFields);
}
```
If a client sends an update containing any of these keys, the entire operation is immediately rejected.

### 4.3 Custom Claims Authority
Custom Claims (`request.auth.token.role` and `request.auth.token.plan`) can only be modified using the Firebase Admin SDK executing within trusted Cloud Functions:
```typescript
// Only trusted server-side webhook handler can execute this:
await admin.auth().setCustomUserClaims(uid, {
  role: 'premium_user',
  plan: 'pro'
});
```

---

## 5. API Endpoint Authorization Middleware

All backend Cloud Functions implement standard authorization middleware:

```typescript
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
    role: string;
    plan: string;
  };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: decodedToken.role || 'free_user',
      plan: decodedToken.plan || 'free',
    };
    next();
  } catch (err: any) {
    if (err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Session revoked. Please sign in again.' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
  }
};

export const requirePlan = (requiredPlan: 'pro' | 'enterprise') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPlan = req.user.plan;
    if (userPlan === 'enterprise') return next();
    if (requiredPlan === 'pro' && userPlan === 'pro') return next();

    return res.status(403).json({
      error: `Forbidden: This operation requires an active ${requiredPlan.toUpperCase()} subscription.`,
    });
  };
};
```
