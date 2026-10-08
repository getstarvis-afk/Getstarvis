import { requireNewsroomEditor, sendError } from '../../server/newsroom/auth.js';
import { getAdminServices } from '../../server/newsroom/firebase.js';
import { listNewsroomAudit } from '../../server/newsroom/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } });
  try {
    await requireNewsroomEditor(req);
    const { db } = getAdminServices();
    return res.status(200).setHeader('Cache-Control', 'private, no-store').json(await listNewsroomAudit({ db }));
  } catch (error) { return sendError(res, error); }
}
