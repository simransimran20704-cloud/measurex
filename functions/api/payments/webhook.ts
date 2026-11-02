import { jsonResponse, Env } from '../../utils/auth';
import { sha256 } from '../../utils/crypto';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'DB_UNAVAILABLE' }, 503);
  }

  const signatureHeader = request.headers.get('Stripe-Signature');
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!signatureHeader || !webhookSecret) {
    return jsonResponse({ error: 'WEBHOOK_CONFIG_MISSING', message: 'Signature or secret missing' }, 400);
  }

  const rawBody = await request.text();

  // 1. Webhook Signature Verification (HMAC-SHA256)
  // Parse Stripe signature format: t=timestamp,v1=signature
  const sigParts: Record<string, string> = {};
  signatureHeader.split(',').forEach((part) => {
    const [k, v] = part.trim().split('=');
    if (k && v) sigParts[k] = v;
  });

  const timestamp = sigParts['t'];
  const expectedSig = sigParts['v1'];

  if (!timestamp || !expectedSig) {
    return jsonResponse({ error: 'INVALID_SIGNATURE_HEADER' }, 400);
  }

  // Tolerance check (5 minutes)
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(timestamp, 10)) > 300) {
    return jsonResponse({ error: 'SIGNATURE_TIMESTAMP_EXPIRED' }, 400);
  }

  // Compute HMAC using Web Crypto
  const signedPayload = `${timestamp}.${rawBody}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(signedPayload));
  const computedHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time check
  if (computedHex !== expectedSig) {
    return jsonResponse({ error: 'SIGNATURE_VERIFICATION_FAILED' }, 400);
  }

  // 2. Parse Event
  const event = JSON.parse(rawBody);

  // 3. Replay Attack Protection (Idempotency check in D1)
  const existingEvent = await env.DB.prepare('SELECT event_id FROM payment_events WHERE event_id = ?')
    .bind(event.id)
    .first();

  if (existingEvent) {
    // Event already processed safely
    return jsonResponse({ received: true, idempotent: true }, 200);
  }

  const payloadHash = await sha256(rawBody);

  // 4. Atomic Execution
  try {
    if (event.type === 'checkout.session.completed') {
      const sessionObj = event.data.object;
      const userId = sessionObj.metadata?.userId || sessionObj.client_reference_id;
      const targetPlan = sessionObj.metadata?.plan || 'pro';

      if (userId) {
        await env.DB.batch([
          env.DB.prepare(
            `INSERT INTO payment_events (event_id, event_type, payload_hash) VALUES (?, ?, ?)`
          ).bind(event.id, event.type, payloadHash),

          env.DB.prepare(
            `UPDATE subscriptions 
             SET plan = ?, status = 'active', stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = unixepoch() 
             WHERE user_id = ?`
          ).bind(targetPlan, sessionObj.customer || null, sessionObj.subscription || null, userId),

          env.DB.prepare(
            `UPDATE users SET plan = ?, updated_at = unixepoch() WHERE id = ?`
          ).bind(targetPlan, userId),

          env.DB.prepare(
            `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata)
             VALUES (?, ?, 'SUBSCRIPTION_UPGRADED', 'INFO', ?)`
          ).bind(
            `log_${crypto.randomUUID()}`,
            userId,
            JSON.stringify({ plan: targetPlan, stripeEventId: event.id })
          ),
        ]);
      }
    } else {
      // Record any other unhandled event type in ledger
      await env.DB.prepare(
        `INSERT INTO payment_events (event_id, event_type, payload_hash) VALUES (?, ?, ?)`
      )
        .bind(event.id, event.type, payloadHash)
        .run();
    }

    return jsonResponse({ received: true }, 200);
  } catch (err: any) {
    return jsonResponse({ error: 'DB_ERROR', message: err.message }, 500);
  }
}
