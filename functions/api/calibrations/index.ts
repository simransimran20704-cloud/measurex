import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  const calibrations = await env.DB.prepare(
    `SELECT id, device_label, ppi, unit, standard_name, reference_length, pixel_length, updated_at, created_at
     FROM calibrations
     WHERE user_id = ?
     ORDER BY updated_at DESC`
  )
    .bind(session.userId)
    .all();

  return jsonResponse({ calibrations: calibrations.results || [] });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { deviceLabel, ppi, unit, standardName, referenceLength, pixelLength } = body;

    const cleanLabel = String(deviceLabel || 'Display Device').trim();
    const ppiNum = Number(ppi);

    if (!ppiNum || ppiNum <= 0 || ppiNum > 1000) {
      return jsonResponse({ error: 'INVALID_PPI', message: 'Valid screen PPI must be between 1 and 1000' }, 400);
    }

    const calibId = `calib_${crypto.randomUUID().slice(0, 12)}`;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      `INSERT INTO calibrations (id, user_id, device_label, ppi, unit, standard_name, reference_length, pixel_length, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        calibId,
        session.userId,
        cleanLabel,
        ppiNum,
        unit || 'mm',
        standardName || 'Physical Reference Standard',
        referenceLength ? Number(referenceLength) : null,
        pixelLength ? Number(pixelLength) : null,
        now,
        now
      )
      .run();

    return jsonResponse(
      {
        success: true,
        calibration: {
          id: calibId,
          deviceLabel: cleanLabel,
          ppi: ppiNum,
          unit: unit || 'mm',
          standardName,
        },
      },
      201
    );
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message }, 500);
  }
}
