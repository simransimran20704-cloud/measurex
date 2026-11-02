# MEASUREX – CLOUD FIRESTORE SECURITY RULES (PHASE 5)
**Document Version:** 1.0.0  
**Target Service:** Cloud Firestore Security Rules Engine  
**Security Posture:** Strict Default-Deny, Tenant-Isolated Subcollections, Anti-Privilege Escalation  

---

## 1. Production `firestore.rules` Implementation

Below is the complete, declarative, production-ready security rules configuration for MeasureX.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // =========================================================================
    // GLOBAL SECURITY & AUTHORIZATION HELPERS
    // =========================================================================

    // Verify user is signed in
    function isAuthenticated() {
      return request.auth != null;
    }

    // Verify user owns the document path
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Verify user has verified their email address
    function isEmailVerified() {
      return isAuthenticated() && request.auth.token.email_verified == true;
    }

    // Check custom claims role
    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }

    // Check user plan from verified token custom claims
    function hasProOrHigher() {
      return isAuthenticated() && 
        (request.auth.token.plan == 'pro' || request.auth.token.plan == 'enterprise' || isAdmin());
    }

    // Protect against privilege escalation: prevent users from altering critical subscription fields
    function noPrivilegeEscalation() {
      let forbiddenFields = ['role', 'plan', 'subscriptionStatus', 'currentPeriodEnd', 'createdAt'];
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(forbiddenFields);
    }

    // Validate Project Document Fields
    function isValidProject() {
      let data = request.resource.data;
      return data.title is string && data.title.size() >= 1 && data.title.size() <= 120 &&
             data.ownerId == request.auth.uid &&
             data.activeUnit in ['mm', 'cm', 'm', 'in', 'ft'] &&
             data.shapes is list;
    }

    // Validate Measurement History Entry
    function isValidMeasurement() {
      let data = request.resource.data;
      return data.tool is string && data.tool.size() >= 1 &&
             data.rawNumericValue is number &&
             data.unit is string &&
             data.ownerId == request.auth.uid;
    }

    // =========================================================================
    // DEFAULT DENY ALL UNMATCHED PATHS
    // =========================================================================
    match /{document=**} {
      allow read, write: if false;
    }

    // =========================================================================
    // USER PROFILES & SETTINGS: /users/{userId}
    // =========================================================================
    match /users/{userId} {
      // User can read their own profile; admins can read any profile
      allow read: if isOwner(userId) || isAdmin();

      // Creation is allowed upon signup with basic defaults
      allow create: if isOwner(userId) &&
        request.resource.data.id == userId &&
        request.resource.data.email == request.auth.token.email &&
        request.resource.data.plan == 'free' && // Never allow self-assigning pro plan
        request.resource.data.role == 'user';

      // Updates allowed ONLY on non-privileged fields (e.g. displayName, privacyConsent)
      allow update: if isOwner(userId) && noPrivilegeEscalation();

      // Account deletion allowed by owner or admin
      allow delete: if isOwner(userId) || isAdmin();

      // -----------------------------------------------------------------------
      // USER SUBCOLLECTION: /users/{userId}/projects/{projectId}
      // -----------------------------------------------------------------------
      match /projects/{projectId} {
        allow read: if isOwner(userId);
        
        // Creating projects in cloud requires email verification
        allow create: if isOwner(userId) && isEmailVerified() && isValidProject();
        
        allow update: if isOwner(userId) && isValidProject() &&
                      request.resource.data.ownerId == resource.data.ownerId; // Cannot change owner
        
        allow delete: if isOwner(userId);
      }

      // -----------------------------------------------------------------------
      // USER SUBCOLLECTION: /users/{userId}/measurements/{measurementId}
      // -----------------------------------------------------------------------
      match /measurements/{measurementId} {
        allow read: if isOwner(userId);
        allow create: if isOwner(userId) && isValidMeasurement();
        allow update: if isOwner(userId) && isValidMeasurement();
        allow delete: if isOwner(userId);
      }

      // -----------------------------------------------------------------------
      // USER SUBCOLLECTION: /users/{userId}/calibrations/{calibrationId}
      // -----------------------------------------------------------------------
      match /calibrations/{calibrationId} {
        allow read, write: if isOwner(userId);
      }

      // -----------------------------------------------------------------------
      // USER SUBCOLLECTION: /users/{userId}/documents/{documentId}
      // -----------------------------------------------------------------------
      match /documents/{documentId} {
        allow read, write: if isOwner(userId);
      }
    }

    // =========================================================================
    // SERVER-MANAGED SUBSCRIPTIONS: /subscriptions/{subscriptionId}
    // =========================================================================
    match /subscriptions/{subscriptionId} {
      // Users can only view their own subscription
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      
      // Client writes are STRICTLY FORBIDDEN (Updated exclusively by Cloud Functions Admin SDK)
      allow write: if false;
    }

    // =========================================================================
    // PAYMENT EVENT LEDGER: /paymentEvents/{eventId}
    // =========================================================================
    match /paymentEvents/{eventId} {
      // Webhook ledger is strictly internal to Cloud Functions
      allow read, write: if false;
    }

    // =========================================================================
    // AUDIT LOGS: /auditLogs/{logId}
    // =========================================================================
    match /auditLogs/{logId} {
      // Only system administrators may inspect audit trails
      allow read: if isAdmin();
      
      // Write operations are append-only via Cloud Functions Admin SDK
      allow write: if false;
    }

    // =========================================================================
    // PUBLIC CONFIGURATION: /publicConfiguration/{configId}
    // =========================================================================
    match /publicConfiguration/{configId} {
      // Publicly readable by all users (standards constants, material densities)
      allow read: if true;
      
      // Writeable only by system administrators
      allow write: if isAdmin();
    }
  }
}
```

---

## 2. Key Security Properties Enforced

1. **Anti-Tampering Rule (`noPrivilegeEscalation`)**:  
   If a client attempts to patch `{ plan: 'enterprise', role: 'admin' }`, Firestore's `.diff().affectedKeys().hasAny(...)` immediately evaluates to `true` and rejects the transaction with `PERMISSION_DENIED`.

2. **Insecure Direct Object Reference (IDOR) Elimination**:  
   Since all private assets reside under `/users/{userId}/**` and rules enforce `request.auth.uid == userId`, it is mathematically impossible for User A to query or mutate User B's documents, even if they guess User B's project ID.

3. **Email Verification Gate (`isEmailVerified`)**:  
   Prevents disposable unverified accounts from creating projects and storing technical data on cloud storage.

4. **Zero-Trust Subscriptions**:  
   The `/subscriptions` collection has `allow write: if false;`. Only trusted server Cloud Functions executing with the Firebase Admin SDK (which bypasses client rules) can activate, renew, or cancel subscriptions.
