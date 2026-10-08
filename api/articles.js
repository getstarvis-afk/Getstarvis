import { getAdminServices } from '../server/newsroom/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).setHeader('Allow', 'GET').json({ error: 'Méthode non autorisée.' });
  try {
    const { db } = getAdminServices();
    const snapshot = await db.collection('publishedArticles').orderBy('publishedAt', 'desc').limit(50).get();
    const articles = snapshot.docs.map((doc) => doc.data()).filter((article) => article.slug && article.title && article.articleBody);
    return res.status(200).setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60').json({ articles });
  } catch {
    return res.status(503).setHeader('Cache-Control', 'no-store').json({ articles: [], error: 'Les articles publiés sont momentanément indisponibles.' });
  }
}
