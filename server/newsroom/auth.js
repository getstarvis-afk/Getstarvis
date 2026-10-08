import { getAdminServices } from './firebase.js';

export async function requireNewsroomEditor(req) {
  const authorization = req.headers?.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw Object.assign(new Error('Connecte-toi pour accéder au Newsroom.'), { status: 401, code: 'AUTH_REQUIRED' });
  const { auth } = getAdminServices();
  let identity;
  try { identity = await auth.verifyIdToken(token); }
  catch { throw Object.assign(new Error('Session invalide. Reconnecte-toi.'), { status: 401, code: 'AUTH_INVALID' }); }
  const allowlist = String(process.env.NEWSROOM_ADMIN_EMAILS || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  const email = String(identity.email || '').toLowerCase();
  const hasAdminClaim = identity.newsroomAdmin === true;
  if (!(email && allowlist.includes(email)) && !hasAdminClaim) throw Object.assign(new Error('Ce compte ne possède pas les droits de rédaction.'), { status: 403, code: 'EDITOR_FORBIDDEN' });
  return { uid: identity.uid, email };
}

export function sendError(res, error) {
  const status = Number(error?.status) || (error?.message?.includes('credentials are not configured') ? 503 : 500);
  if (status === 500) console.error('Newsroom server error:', error?.code || 'internal');
  res.status(status).json({ error: { code: error?.code || (status === 503 ? 'NEWSROOM_SETUP_REQUIRED' : 'NEWSROOM_ERROR'), message: status === 500 ? 'Le service éditorial est momentanément indisponible.' : error.message } });
}
