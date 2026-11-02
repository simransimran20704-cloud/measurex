import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);

  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Not authenticated' }, 401);
  }

  return jsonResponse({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.fullName,
      role: session.role,
      plan: session.plan,
    },
  });
}
