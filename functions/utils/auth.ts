import { sha256 } from './crypto';

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'user' | 'metrologist' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Env {
  DB: any;
  DOCUMENTS_VAULT?: any;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
}

export function jsonResponse(data: any, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

export function parseCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [name, ...val] = part.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(val.join('='));
    }
  });
  return cookies;
}

export async function getSessionUser(request: Request, db: any): Promise<UserSession | null> {
  if (!db) return null;
  const cookies = parseCookies(request);
  const rawToken = cookies['__Host-mx_session'] || cookies['mx_session'];

  if (!rawToken) {
    // Also support Authorization Bearer token header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const bearerToken = authHeader.substring(7).trim();
    if (!bearerToken) return null;
    return getSessionUserFromToken(bearerToken, db);
  }

  return getSessionUserFromToken(rawToken, db);
}

async function getSessionUserFromToken(token: string, db: any): Promise<UserSession | null> {
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  const row = await db
    .prepare(
      `SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.full_name, u.role, u.plan
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token_hash = ? AND s.expires_at > ?`
    )
    .bind(tokenHash, now)
    .first();

  if (!row) return null;

  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    plan: row.plan,
  };
}

export async function createSession(
  db: any,
  userId: string,
  userAgent?: string,
  ip?: string
): Promise<{ rawToken: string; cookieHeader: string }> {
  // Generate 256-bit cryptographic session token
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawToken = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const tokenHash = await sha256(rawToken);
  const sessionId = `sess_${crypto.randomUUID()}`;
  const maxAge = 7 * 24 * 3600; // 7 days
  const expiresAt = Math.floor(Date.now() / 1000) + maxAge;
  const ipHash = ip ? await sha256(ip) : null;

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, session_token_hash, expires_at, ip_hash, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(sessionId, userId, tokenHash, expiresAt, ipHash, userAgent || null)
    .run();

  const cookieHeader = `__Host-mx_session=${rawToken}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

  return { rawToken, cookieHeader };
}

export async function destroySession(db: any, request: Request): Promise<string> {
  const cookies = parseCookies(request);
  const rawToken = cookies['__Host-mx_session'] || cookies['mx_session'];

  if (rawToken && db) {
    const tokenHash = await sha256(rawToken);
    await db
      .prepare(`DELETE FROM sessions WHERE session_token_hash = ?`)
      .bind(tokenHash)
      .run();
  }

  return `__Host-mx_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
