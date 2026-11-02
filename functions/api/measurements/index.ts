import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const measurements = await env.DB.prepare(
    `SELECT id, project_id, tool, title, value, raw_numeric_value, unit, details, created_at
     FROM measurements
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 100`
  )
    .bind(session.userId)
    .all();

  return jsonResponse({ measurements: measurements.results || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { tool, title, value, rawNumericValue, unit, details, projectId } = body;

    const measurementId = `meas_${crypto.randomUUID().slice(0, 12)}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO measurements (id, user_id, project_id, tool, title, value, raw_numeric_value, unit, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        measurementId,
        session.userId,
        projectId || null,
        tool || 'Generic',
        title || 'Measurement Log',
        String(value || ''),
        Number(rawNumericValue) || 0,
        unit || 'mm',
        details || null,
        now
      )
      .run();

    return jsonResponse(
      {
        success: true,
        measurement: {
          id: measurementId,
          tool,
          title,
          value,
          rawNumericValue,
          unit,
          details,
          timestamp: now * 1000,
        },
      },
      201
    );
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message }, 500);
  }
}
