import { getAdminServices } from '../../server/newsroom/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Méthode non autorisée.' });
  const slug = String(req.query?.slug || '').replace(/[^a-z0-9-]/gi, '').slice(0, 90);
  if (!slug) return res.status(404).json({ article: null });
  try {
    const { db } = getAdminServices();
    const snapshot = await db.collection('publishedArticles').doc(slug).get();
    if (!snapshot.exists) return res.status(404).setHeader('Cache-Control', 'public, max-age=15').json({ article: null });
    const article = snapshot.data();
    if (!article?.title || !article?.articleBody) return res.status(404).json({ article: null });
    return res.status(200).setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').json({ article });
  } catch {
    return res.status(503).setHeader('Cache-Control', 'no-store').json({ article: null, error: 'Article momentanément indisponible.' });
  }
}
