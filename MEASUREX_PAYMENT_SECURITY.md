# MEASUREX PAYMENT SECURITY & SUBSCRIPTION INTEGRITY SPECIFICATION
**Document Version:** 1.0.0  
**Classification:** Confidential – MeasureX Platform Engineering  
**Scope:** Server-Side Entitlements, Webhook Cryptographic Verification, PCI-DSS SAQ-A, Idempotency, and Subscription Lifecycle  

---

## 1. Executive Summary

In client-side architectures, users can open browser Developer Tools and edit local variables (`user.plan = 'pro'`), thereby bypassing premium gating without authorization.

The MeasureX payment security architecture enforces a **zero-trust server-authoritative model**:
1. All premium entitlements (CAD export, unlimited calibrations, multi-layer canvas, cloud sync) are validated server-side on every API request.
2. Payment transactions are executed exclusively through PCI-DSS Level 1 compliant gateways (Stripe / Razorpay / LemonSqueezy).
3. Zero primary account numbers (PAN), CVVs, or expiration dates ever transit or reside on MeasureX servers (PCI-DSS SAQ-A compliance).
4. Webhooks utilize HMAC-SHA256 signature verification with distributed replay attack prevention.

---

## 2. Server-Side Entitlement Architecture

```
User (Browser)               MeasureX API (Cloud Run)       Cloud Firestore          Payment Gateway (Stripe)
      |                                  |                         |                           |
      |-- 1. Request CAD Export -------->|                         |                           |
      |   (Includes Bearer JWT)          |                         |                           |
      |                                  |-- 2. Verify Token & UID |                           |
      |                                  |-- 3. Query Subscription |                           |
      |                                  |      (/users/{uid}/sub) |                           |
      |                                  |<-- Returns {plan:'pro'}-|                           |
      |                                  |                         |                           |
      |                                  |-- 4. Check Active Status|                           |
      |                                  |      (status=='active') |                           |
      |                                  |                         |                           |
      |<-- 5. 200 OK + Signed CAD Export-|                         |                           |
      |   (or 403 Forbidden if Free)     |                         |                           |
      |                                  |                         |                           |
      |                                  |<======= 6. Webhook (HMAC Signed) ===================|
      |                                  |         (invoice.payment_succeeded)                 |
      |                                  |-- 7. Verify HMAC Sig ---|                           |
      |                                  |-- 8. Run Atomic Tx ---->|                           |
      |                                  |      Update Plan & Expiry                           |
```

### 2.1 Role & Entitlement Matrix
| Feature / Tool | Free Tier | Premium Tier (\$9.99/mo) | Professional Tier (\$24.99/mo) |
| :--- | :---: | :---: | :---: |
| Basic Rulers & Converters | Unlimited | Unlimited | Unlimited |
| Vernier Caliper & Screw Gauge | Standard | High Precision (0.001mm) | High Precision + Calibration Certs |
| Precision Studio Layers | 1 Layer | 10 Layers | Unlimited Layers |
| Saved Projects Limit | Max 3 | Max 50 | Unlimited |
| Cloud Storage Quota | 25 MB | 2 GB | 25 GB |
| Export Formats | PNG, JPG | High-Res PNG, PDF | SVG, DXF, CSV, PDF, JSON |
| Digital Compass & Scale | Basic | Advanced Mode | Lab-Grade Continuous Mode |
| Client-Side E2EE Encryption | N/A | Available | Included + CMEK Support |

---

## 3. Webhook Signature Verification & Cryptographic Protection

Webhooks notify MeasureX of successful payments, renewals, cancellations, and disputes. Attackers often attempt to forge webhooks to activate illicit subscriptions.

### 3.1 Verification Protocol
1. MeasureX extracts the raw request payload buffer (before JSON parsing).
2. The signature header (`Stripe-Signature` or `X-Razorpay-Signature`) is retrieved.
3. The server computes the HMAC-SHA256 digest using a webhook secret securely retrieved from **Google Cloud Secret Manager**.
4. The server compares signatures using a **constant-time string comparison** (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

### 3.2 Cloud Function Implementation
```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';
import Stripe from 'stripe';
import { db } from './firebaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // 1. Cryptographic HMAC-SHA256 verification of the raw payload
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Security Warning] Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Distributed Replay Attack Protection via Firestore Idempotency Transaction
  const eventRef = db.collection('paymentEvents').doc(event.id);

  try {
    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (eventDoc.exists) {
        // Event already processed - safe return to prevent duplicate provisioning
        return;
      }

      // Record event as processed with 90-day retention
      transaction.set(eventRef, {
        eventId: event.id,
        type: event.type,
        processedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // TTL
      });

      // 3. Process Subscription Lifecycle Events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const uid = session.metadata?.uid;
          const plan = session.metadata?.plan || 'premium';

          if (uid) {
            const userSubRef = db.collection('users').doc(uid).collection('subscription').doc('current');
            transaction.set(userSubRef, {
              plan,
              status: 'active',
              customerId: session.customer,
              subscriptionId: session.subscription,
              updatedAt: new Date(),
            }, { merge: true });
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const uid = subscription.metadata?.uid;
          if (uid) {
            const userSubRef = db.collection('users').doc(uid).collection('subscription').doc('current');
            transaction.update(userSubRef, {
              plan: 'free',
              status: 'canceled',
              canceledAt: new Date(),
            });
          }
          break;
        }

        default:
          break;
      }
    });

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error(`[Error] Failed to process payment event ${event.id}:`, error);
    return res.status(500).send('Internal Server Error');
  }
}
```

---

## 4. Replay Attack Prevention

To prevent an adversary from replaying an intercepted valid webhook payload:
1. **Timestamp Freshness:** Reject any webhook where `timestamp` is older than 5 minutes (`tolerance: 300` in Stripe SDK).
2. **Idempotency Ledger:** Every incoming `eventId` is recorded inside `/paymentEvents/{eventId}` inside an atomic transaction. If the ID exists, processing terminates immediately with `200 OK`.
3. **Firestore TTL Index:** The `expiresAt` field is indexed with a Cloud Firestore TTL rule, automatically deleting historical ledger entries after 90 days.

---

## 5. PCI-DSS Compliance (SAQ-A Scope)

MeasureX achieves the simplest and most secure PCI-DSS posture: **Self-Assessment Questionnaire A (SAQ-A)**.

1. **Zero Cardholder Data Flow:** Cardholder PANs, PINs, CVVs, and magnetic stripe data never touch MeasureX servers, databases, RAM, or logs.
2. **Hosted Checkouts & Elements:** Payment collection is offloaded via:
   - Stripe Checkout hosted sessions (external redirect to `https://checkout.stripe.com`), or
   - Stripe Elements with iframes hosted entirely on Stripe’s PCI-DSS Level 1 certified origin.
3. **Content Security Policy Enforcement:**
   ```http
   Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://checkout.stripe.com; connect-src 'self' https://api.stripe.com;
   ```

---

## 6. Client Billing Form Fraud & Security Validation

The MeasureX frontend billing modal enforces strict pre-checkout checks to mitigate automated carding attacks:
1. **Strict Field Validation:** Rejection of incomplete addresses, bogus postal codes, or blank names before invoking checkout APIs.
2. **Firebase App Check / reCAPTCHA Enterprise:** Unauthenticated bots are blocked from initiating checkout sessions.
3. **Session Rate Limiting:** Maximum 3 checkout initialization attempts per user IP per 10 minutes.
4. **3D Secure 2.0 (SCA):** Mandatory Strong Customer Authentication compliant with European PSD2 regulations.

---

## 7. Subscription Lifecycle & Grace Period Policy

* **Failed Payment (`invoice.payment_failed`):**
  * Account enters a **3-day grace period** (`status: 'past_due'`). User maintains access while receiving automated email prompts to update payment methods.
  * After 3 days, if uncollected, account automatically downgrades to `'free'`. Existing technical drawings are preserved in read-only mode (never deleted).
* **Refunds & Disputes (`charge.dispute.created`):**
  * Immediate revocation of premium entitlement for the disputed billing cycle.
  * Creation of a security audit log entry in `/auditLogs` for manual review.
