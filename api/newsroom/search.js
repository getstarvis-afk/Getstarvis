import { requireNewsroomEditor, sendError } from '../../server/newsroom/auth.js';
import { getAdminServices } from '../../server/newsroom/firebase.js';
import { categoryCatalog } from '../../server/newsroom/catalog.js';
import { runCategorySearch } from '../../server/newsroom/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } });
  try {
    const editor = await requireNewsroomEditor(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const categoryId = String(body.categoryId || '');
    if (!categoryCatalog[categoryId]) return res.status(400).json({ error: { code: 'UNKNOWN_CATEGORY', message: 'Choisis une rubrique éditoriale valide.' } });
    const options = {
      timespan: ['1h','3h','6h','12h','24h','3d','1w','2w','1m','3m'].includes(body.timespan) ? body.timespan : '24h',
      maxRecords: Math.max(1, Math.min(250, Number(body.maxRecords) || 75)),
      sort: body.sort === 'dateasc' ? 'dateasc' : 'datedesc',
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      language: /^[a-z-]{2,24}$/i.test(String(body.language || '')) ? String(body.language).toLowerCase() : undefined,
      sourceCountry: /^[a-z]{2,40}$/i.test(String(body.sourceCountry || '')) ? String(body.sourceCountry).toLowerCase() : undefined,
    };
    const { db } = getAdminServices();
    const result = await runCategorySearch({ ...editor, categoryId, options, db });
    return res.status(200).json(result);
  } catch (error) { return sendError(res, error); }
}
