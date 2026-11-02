import { verifyPassword } from '../../utils/crypto';
import { jsonResponse, createSession, Env } from '../../utils/auth';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!env.DB) {
    return jsonResponse({ error: 'DB_UNAVAILABLE', message: 'Database binding not configured' }, 503);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { email, password } = body;

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanEmail || !cleanPassword) {
      return jsonResponse(
        { error: 'INVALID_CREDENTIALS', message: 'Please provide both email and password.' },
        400
      );
    }

    // 1. Fetch User by Email
    const user = await env.DB.prepare(
      `SELECT id, email, password_hash, salt, full_name, role, plan 
       FROM users 
       WHERE email = ?`
    )
      .bind(cleanEmail)
      .first();

    if (!user) {
      return jsonResponse(
        {
          error: 'ACCOUNT_NOT_FOUND',
          message: `No account registered with "${cleanEmail}". Please check your email or create an account.`,
        },
        404
      );
    }

    // 2. Constant-Time Password Verification
    const isPasswordValid = await verifyPassword(cleanPassword, user.password_hash, user.salt);

    if (!isPasswordValid) {
      // Audit log failed attempt
      await env.DB.prepare(
        `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata)
         VALUES (?, ?, 'LOGIN_FAILED', 'WARNING', ?)`
      )
        .bind(
          `log_${crypto.randomUUID()}`,
          user.id,
          JSON.stringify({ ip: request.headers.get('cf-connecting-ip'), reason: 'BAD_PASSWORD' })
        )
        .run();

      return jsonResponse(
        {
          error: 'INCORRECT_PASSWORD',
          message: 'Incorrect password! Please check your credentials.',
        },
        401
      );
    }

    // 3. Create Server-Side Session
    const userAgent = request.headers.get('User-Agent') || undefined;
    const ip = request.headers.get('cf-connecting-ip') || undefined;
    const { rawToken, cookieHeader } = await createSession(env.DB, user.id, userAgent, ip);

    // Audit log successful login
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata)
       VALUES (?, ?, 'LOGIN_SUCCESS', 'INFO', ?)`
    )
      .bind(`log_${crypto.randomUUID()}`, user.id, JSON.stringify({ ip }))
      .run();

    return jsonResponse(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          plan: user.plan,
        },
        token: rawToken, // For non-cookie clients/testing
      },
      200,
      { 'Set-Cookie': cookieHeader }
    );
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message || 'Login failed' }, 500);
  }
}
