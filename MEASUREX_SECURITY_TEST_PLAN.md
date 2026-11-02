# MEASUREX – SECURITY TEST PLAN & VERIFICATION SUITE (PHASE 10)
**Document Version:** 1.0.0  
**Testing Harness:** Firebase Emulator Suite, Vitest 5.1.0, `@firebase/rules-unit-testing`  
**Test Standard:** OWASP Web Security Testing Guide (WSTG v4.2)  

---

## 1. Security Testing Strategy

MeasureX employs a 12-suite automated and manual security verification harness. Testing executes against the **local Firebase Emulator Suite** to prove that authorization gates, security rules, and webhook cryptographic verifications operate correctly under simulated attack conditions before any code reaches production.

```
┌────────────────────────────────────────────────────────┐
│             MeasureX Security Test Suite               │
├──────────────────────────┬─────────────────────────────┤
│ 1. Account Brute Force   │ 7. Unauthorized File Access │
│ 2. IDOR Project Access   │ 8. Malicious MIME Uploads   │
│ 3. Privilege Escalation  │ 9. Sensitive Data Leakage   │
│ 4. Subscription Bypass   │ 10. Session Invalidation    │
│ 5. Forged Webhook Attack │ 11. Firestore Rules Tests   │
│ 6. Webhook Replay Attack │ 12. Storage Rules Tests     │
└──────────────────────────┴─────────────────────────────┘
```

---

## 2. Detailed Test Cases & Assertions

### Test Suite 1: Unauthorized Account Access & Brute-Force Defense
- **Attack Scenario:** Attacker executes automated password guessing script against `user@measurex.io`.
- **Test Method:** Execute 10 rapid sign-in requests with invalid passwords within 10 seconds.
- **Expected Result:** Identity Platform rejects attempts with `auth/too-many-requests` and enforces progressive 15-minute IP backoff.
- **Assertion:** Account is not compromised; zero unauthorized tokens issued.

### Test Suite 2: Cross-User Project Access (IDOR Test)
- **Attack Scenario:** Authenticated User A (`uid_alice`) queries `/users/uid_bob/projects/proj_secret_blueprint`.
- **Test Method:** Using Firestore client SDK authenticated as Alice, call `doc('users/uid_bob/projects/proj_secret_blueprint').get()`.
- **Expected Result:** Firestore Security Rules block the query immediately with `FirebaseError: Missing or insufficient permissions.`
- **Assertion:** Zero cross-tenant data leakage.

### Test Suite 3: Privilege Escalation Attack
- **Attack Scenario:** User Alice on Free tier attempts to mutate her document: `updateDoc(doc('users/uid_alice'), { plan: 'enterprise', role: 'admin' })`.
- **Test Method:** Client executes patch targeting forbidden fields.
- **Expected Result:** Blocked by `noPrivilegeEscalation()` helper in Firestore Rules with `PERMISSION_DENIED`.
- **Assertion:** User remains on Free tier; role remains `user`.

### Test Suite 4: Subscription Bypass & Paywall Tampering
- **Attack Scenario:** Free user opens DevTools, executes `localStorage.setItem('measurex_auth_user', JSON.stringify({ plan: 'enterprise' }))`, and triggers the PDF Export or CAD DXF export cloud function.
- **Test Method:** Call Cloud Function endpoint `exportCadDxf(projectId)`.
- **Expected Result:** Cloud Function inspects cryptographically signed `context.auth.token.plan`. Since token does not contain `plan: 'enterprise'`, Cloud Function aborts with `403 Forbidden: Enterprise subscription required.`
- **Assertion:** Frontend paywall modifications cannot unlock backend capabilities.

### Test Suite 5: Forged Payment Webhook Attack
- **Attack Scenario:** Attacker crafts a fake `customer.subscription.created` webhook payload and POSTs to `/api/webhooks/stripe` with a forged `Stripe-Signature` header.
- **Test Method:** Send HTTP POST with invalid HMAC SHA-256 signature.
- **Expected Result:** `stripe.webhooks.constructEvent()` throws cryptographic verification exception; function returns `400 Bad Request` and logs security warning.
- **Assertion:** No subscription is granted; no database records altered.

### Test Suite 6: Webhook Replay & Duplicate Event Attack
- **Attack Scenario:** Attacker intercepts a valid historical webhook payload from 6 months ago and retransmits it to prolong subscription.
- **Test Method:** Re-send valid payload with previously processed `event.id`.
- **Expected Result:** Cloud Function inspects `/paymentEvents/{eventId}` ledger, detects duplicate status, returns `200 Deduplicated`, and takes zero activation action.
- **Assertion:** Duplicate events cannot extend or grant unauthorized subscription time.

### Test Suite 7: Unauthorized Direct File Download
- **Attack Scenario:** Unauthenticated user attempts to download a private technical blueprint via direct cloud storage URL: `https://storage.googleapis.com/measurex-vault/users/uid_bob/projects/p1/drawing.png`.
- **Test Method:** Send unauthenticated `curl` request.
- **Expected Result:** HTTP `403 Access Denied` (Public bucket access disabled).
- **Assertion:** Storage objects cannot be accessed without authenticated ownership tokens.

### Test Suite 8: Malicious File Upload & Path Traversal Attack
- **Attack Scenario:** Attacker attempts to upload a PHP web shell or executable renamed as a blueprint: `../../etc/passwd` or `malware.exe` with MIME `application/x-msdownload`.
- **Test Method:** Execute Storage upload to `/users/{uid}/projects/{pid}/malware.exe`.
- **Expected Result:** Storage Rules helper `isSafeFilename()` and `isValidImage()` reject the upload with `StorageException: User does not have permission to access this object.`
- **Assertion:** Non-whitelisted MIME types and path traversal filenames are blocked.

### Test Suite 9: Sensitive Information Leakage in Network & Console
- **Attack Scenario:** Inspect network payloads, browser console logs, and Redux/Zustand state for unhashed passwords, raw card numbers, or internal secret keys.
- **Test Method:** Execute complete checkout and measurement workflow while recording Chrome DevTools HAR trace.
- **Expected Result:** Zero card numbers, zero CVVs, zero unhashed passwords, and zero GCP API secret keys appear in network requests or console output.
- **Assertion:** Complete credential sanitation.

### Test Suite 10: Session Invalidation & Revocation
- **Attack Scenario:** User signs out or resets password; attacker attempts to use previously harvested refresh token.
- **Test Method:** Call `admin.auth().revokeRefreshTokens(uid)` and attempt to mint a new ID token with old refresh token.
- **Expected Result:** Firebase Auth rejects refresh token with `auth/id-token-revoked`.
- **Assertion:** Old sessions are immediately dead.

---

## 3. Automated Firestore Rules Unit Test Harness

Using `@firebase/rules-unit-testing`, automated CI tests run against the local Firestore Emulator:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { describe, it, beforeAll, afterAll } from 'vitest';
import fs from 'fs';

let testEnv: any;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'measurex-security-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('MeasureX Firestore Security Rules Automated Suite', () => {
  it('prevents unauthenticated users from reading private projects', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    const projRef = unauthDb.doc('users/alice/projects/p1');
    await assertFails(projRef.get());
  });

  it('prevents User Bob from reading User Alice projects (IDOR)', async () => {
    const bobDb = testEnv.authenticatedContext('bob', { email_verified: true }).firestore();
    const aliceProjRef = bobDb.doc('users/alice/projects/p1');
    await assertFails(aliceProjRef.get());
  });

  it('allows Alice to read and write her own projects when verified', async () => {
    const aliceDb = testEnv.authenticatedContext('alice', { email_verified: true }).firestore();
    const aliceProjRef = aliceDb.doc('users/alice/projects/p1');
    await assertSucceeds(
      aliceProjRef.set({
        id: 'p1',
        ownerId: 'alice',
        title: 'Precision Shaft Bracket',
        activeUnit: 'mm',
        shapes: [],
      })
    );
  });

  it('blocks Alice from escalating her plan to enterprise', async () => {
    const aliceDb = testEnv.authenticatedContext('alice', { email_verified: true }).firestore();
    const aliceProfile = aliceDb.doc('users/alice');
    // Attempting to patch plan directly
    await assertFails(aliceProfile.update({ plan: 'enterprise' }));
  });
});
```
