import { getAdminServices } from '../../server/newsroom/firebase.js';
import { categoryCatalog } from '../../server/newsroom/catalog.js';
import { runCategorySearch } from '../../server/newsroom/store.js';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).setHeader('Allow', 'GET, POST').json({ error: 'Méthode non autorisée.' });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers?.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'Accès refusé.' });
  const categoryId = String(req.query?.categoryId || '');
  if (!categoryCatalog[categoryId]) return res.status(400).json({ error: 'Rubrique inconnue.' });
  try {
    const { db } = getAdminServices();
    const result = await runCategorySearch({ uid: 'scheduled-newsroom', email: 'scheduler@getstarvis.internal', categoryId, options: { timespan: '24h', maxRecords: 50, sort: 'datedesc' }, db });
    return res.status(200).json({ ok: true, result });
  } catch {
    return res.status(503).json({ error: 'La recherche planifiée est momentanément indisponible.' });
  }
}
