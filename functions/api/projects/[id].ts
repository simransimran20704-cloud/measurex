import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestGet(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const project = await env.DB.prepare(
    `SELECT * FROM projects WHERE id = ? AND is_deleted = 0`
  )
    .bind(params.id)
    .first();

  if (!project) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
  }

  // Strict Anti-IDOR Check
  if (project.user_id !== session.userId && session.role !== 'admin') {
    // Log IDOR probe
    await env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, event_type, severity, metadata)
       VALUES (?, ?, 'IDOR_PROBE', 'CRITICAL', ?)`
    )
      .bind(
        `log_${crypto.randomUUID()}`,
        session.userId,
        JSON.stringify({ targetProjectId: params.id, probeIp: request.headers.get('cf-connecting-ip') })
      )
      .run();

    return jsonResponse({ error: 'FORBIDDEN', message: 'You do not have permission to access this project.' }, 403);
  }

  return jsonResponse({ project });
}

export async function onRequestPut(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const project = await env.DB.prepare(
    `SELECT user_id FROM projects WHERE id = ? AND is_deleted = 0`
  )
    .bind(params.id)
    .first();

  if (!project) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
  }

  if (project.user_id !== session.userId && session.role !== 'admin') {
    return jsonResponse({ error: 'FORBIDDEN', message: 'Access denied' }, 403);
  }

  const body = (await request.json().catch(() => ({}))) as any;
  const now = Math.floor(Date.now() / 1000);

  await env.DB.prepare(
    `UPDATE projects
     SET title = COALESCE(?, title),
         description = COALESCE(?, description),
         drawing_data = COALESCE(?, drawing_data),
         points_count = COALESCE(?, points_count),
         updated_at = ?
     WHERE id = ?`
  )
    .bind(
      body.title ? String(body.title).trim() : null,
      body.description ? String(body.description) : null,
      body.drawingData ? JSON.stringify(body.drawingData) : null,
      typeof body.pointsCount === 'number' ? body.pointsCount : null,
      now,
      params.id
    )
    .run();

  return jsonResponse({ success: true, message: 'Project updated successfully' });
}

export async function onRequestDelete(context: { request: Request; env: Env; params: { id: string } }) {
  const { request, env, params } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const project = await env.DB.prepare(
    `SELECT user_id FROM projects WHERE id = ? AND is_deleted = 0`
  )
    .bind(params.id)
    .first();

  if (!project) {
    return jsonResponse({ error: 'NOT_FOUND', message: 'Project not found' }, 404);
  }

  if (project.user_id !== session.userId && session.role !== 'admin') {
    return jsonResponse({ error: 'FORBIDDEN', message: 'Access denied' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);

  // Soft-Delete Tombstone
  await env.DB.prepare(
    `UPDATE projects SET is_deleted = 1, deleted_at = ? WHERE id = ?`
  )
    .bind(now, params.id)
    .run();

  return jsonResponse({ success: true, message: 'Project moved to trash.' });
}
