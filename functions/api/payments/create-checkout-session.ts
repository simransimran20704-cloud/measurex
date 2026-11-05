import { jsonResponse, Env } from '../../utils/auth';

/**
 * Payments & Checkout Endpoint
 * Status: DISABLED - MeasureX is a 100% free engineering platform.
 * Paid subscriptions and checkout sessions cannot be created.
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  return jsonResponse(
    {
      error: 'PAYMENTS_DISABLED',
      message: 'MeasureX is 100% free for all users. Paid subscriptions and checkouts have been disabled.',
      isFreePlatform: true,
    },
    403
  );
}
