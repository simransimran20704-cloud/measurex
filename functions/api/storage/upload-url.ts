import { jsonResponse, getSessionUser, Env } from '../../utils/auth';

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const session = await getSessionUser(request, env.DB);
  if (!session) {
    return jsonResponse({ error: 'UNAUTHORIZED', message: 'Authentication required' }, 401);
  }

  // Graceful degradation when Cloudflare R2 is pending account entitlement (Error 10042)
  if (!env.DOCUMENTS_VAULT) {
    return jsonResponse(
      {
        error: 'STORAGE_UNAVAILABLE',
        message:
          'Cloudflare R2 document vault is currently unavailable (account entitlement error 10042 pending). Measurements, calibrations, and blueprints are safely stored in Cloudflare D1 database.',
        isR2Active: false,
      },
      503
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { filename, mimeType, sizeBytes } = body;

    // 1. MIME Type Whitelist
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return jsonResponse(
        {
          error: 'DISALLOWED_MIME_TYPE',
          message: `File type "${mimeType}" is not allowed. Allowed types: PNG, JPEG, WebP, SVG, PDF.`,
        },
        400
      );
    }

    // 2. File Size Limit
    if (sizeBytes && sizeBytes > MAX_FILE_SIZE_BYTES) {
      return jsonResponse(
        {
          error: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum limit of 10 MB.',
        },
        400
      );
    }

    // 3. Generate Randomized R2 Key
    const ext = filename?.split('.').pop() || 'bin';
    const sanitizedExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    const fileId = `file_${crypto.randomUUID()}`;
    const r2Key = `users/${session.userId}/blueprints/${fileId}.${sanitizedExt}`;

    // Return upload coordinates
    return jsonResponse({
      success: true,
      fileId,
      r2Key,
      uploadUrl: `/api/storage/direct-upload?key=${encodeURIComponent(r2Key)}`,
      expiresInSeconds: 600, // 10 minutes
    });
  } catch (err: any) {
    return jsonResponse({ error: 'SERVER_ERROR', message: err.message }, 500);
  }
}
