import { hashPassword } from '../../utils/crypto';
import { jsonResponse, Env } from '../../utils/auth';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'DB_UNAVAILABLE', message: 'Database binding not configured' }, 503);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { name, email, password } = body;

    // 1. Input Validation
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (cleanName.length < 2) {
      return jsonResponse({ error: 'INVALID_NAME', message: 'Full name must be at least 2 characters.' }, 400);
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return jsonResponse({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' }, 400);
    }

    if (cleanPassword.length < 8) {
      return jsonResponse(
        { error: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' },
        400
      );
    }

    // 2. Duplicate Registration Check
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(cleanEmail)
      .first();

    if (existing) {
      return jsonResponse(
        {
          error: 'ALREADY_REGISTERED',
          message: `⚠️ Warning: "${cleanEmail}" is already registered! You cannot register this email again. Please sign in with your password.`,
        },
        409
      );
    }

    // 3. Password Hashing (Web Crypto PBKDF2 600,000 iterations)
    const { hash, salt } = await hashPassword(cleanPassword);
    const userId = `usr_${crypto.randomUUID().slice(0, 12)}`;

    // 4. Atomic Insert
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, salt, full_name, role, plan, is_email_verified)
         VALUES (?, ?, ?, ?, ?, 'metrologist', 'pro', 1)`
      ).bind(userId, cleanEmail, hash, salt, cleanName),

      env.DB.prepare(
        `INSERT INTO subscriptions (id, user_id, plan, status)
         VALUES (?, ?, 'pro', 'active')`
      ).bind(`sub_${userId}`, userId),

      env.DB.prepare(
        `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata)
         VALUES (?, ?, 'USER_REGISTERED', 'INFO', ?)`
      ).bind(
        `log_${crypto.randomUUID()}`,
        userId,
        JSON.stringify({ email: cleanEmail, registrationIp: request.headers.get('cf-connecting-ip') })
      ),
    ]);

    return jsonResponse(
      {
        success: true,
        message: 'Account registered successfully. Please sign in with your credentials.',
        user: { id: userId, email: cleanEmail, fullName: cleanName, plan: 'pro' },
      },
      201
    );
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message || 'Registration failed' }, 500);
  }
}
