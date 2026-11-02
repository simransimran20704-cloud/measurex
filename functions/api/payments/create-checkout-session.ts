import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { plan, billingCycle, customerDetails } = body;

    if (!['pro', 'enterprise'].includes(plan)) {
      return jsonResponse({ error: 'INVALID_PLAN', message: 'Invalid subscription plan.' }, 400);
    }

    // 1. If Stripe Secret Key is provisioned in Cloudflare Secrets:
    if (env.STRIPE_SECRET_KEY) {
      const origin = new URL(request.url).origin;
      const priceAmount = plan === 'pro' 
        ? (billingCycle === 'annual' ? 14400 : 1900) 
        : (billingCycle === 'annual' ? 40800 : 4900);

      const params = new URLSearchParams();
      params.append('payment_method_types[]', 'card');
      params.append('mode', 'subscription');
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `MeasureX ${plan.toUpperCase()} Plan`);
      params.append('line_items[0][price_data][unit_amount]', String(priceAmount));
      params.append('line_items[0][price_data][recurring][interval]', billingCycle === 'annual' ? 'year' : 'month');
      params.append('line_items[0][quantity]', '1');
      params.append('client_reference_id', session.userId);
      params.append('metadata[userId]', session.userId);
      params.append('metadata[plan]', plan);
      params.append('customer_email', session.email);
      params.append('success_url', `${origin}/?session_id={CHECKOUT_SESSION_ID}&payment_status=success`);
      params.append('cancel_url', `${origin}/?payment_status=cancelled`);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const stripeSession = await stripeRes.json() as any;

      if (!stripeRes.ok) {
        return jsonResponse(
          { error: 'STRIPE_ERROR', message: stripeSession.error?.message || 'Failed to create checkout session' },
          500
        );
      }

      return jsonResponse({
        success: true,
        checkoutUrl: stripeSession.url,
        sessionId: stripeSession.id,
      });
    }

    // 2. If Stripe Secret Key is not yet configured (Safe Development/Preview Mode)
    // NOTE: Does NOT update subscription plan on backend until verified by webhook!
    return jsonResponse({
      success: true,
      mode: 'sandbox_preview',
      message: 'Payment gateway initialized. Connect STRIPE_SECRET_KEY in Cloudflare Secret Manager to enable live checkouts.',
      plan,
      billingCycle,
    });
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message }, 500);
  }
}
