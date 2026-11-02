import { jsonResponse, destroySession, Env } from '../../utils/auth';

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const expiredCookieHeader = await destroySession(env.DB, request);

  return jsonResponse(
    { success: true, message: 'Logged out successfully.' },
    200,
    { 'Set-Cookie': expiredCookieHeader }
  );
}
