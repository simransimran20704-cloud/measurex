import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const projects = await env.DB.prepare(
    `SELECT id, title, type, description, points_count, r2_blueprint_key, updated_at, created_at
     FROM projects
     WHERE user_id = ? AND is_deleted = 0
     ORDER BY updated_at DESC`
  )
    .bind(session.userId)
    .all();

  return jsonResponse({ projects: projects.results || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { title, type, description, drawingData } = body;

    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) {
      return jsonResponse({ error: 'INVALID_TITLE', message: 'Project title is required' }, 400);
    }

    // MeasureX is free: Unlimited projects permitted for all authenticated users

    const projectId = `proj_${crypto.randomUUID().slice(0, 12)}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO projects (id, user_id, title, type, description, drawing_data, points_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
      .bind(
        projectId,
        session.userId,
        cleanTitle,
        type || 'Precision Studio',
        description || 'Newly created measurement project',
        drawingData ? JSON.stringify(drawingData) : null,
        now,
        now
      )
      .run();

    return jsonResponse(
      {
        success: true,
        project: {
          id: projectId,
          title: cleanTitle,
          type: type || 'Precision Studio',
          description: description || 'Newly created measurement project',
          pointsCount: 0,
          lastModified: now * 1000,
        },
      },
      201
    );
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message }, 500);
  }
}
