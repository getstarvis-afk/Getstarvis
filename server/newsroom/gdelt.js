import { createHash } from 'node:crypto';
import { categoryCatalog } from './catalog.js';

const API_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const MAX_RECORDS = 250;
const CACHE_TTL_MS = 5 * 60 * 1000;

export function normalizeGdeltArticle(article, { categoryId, query, retrievedAt = new Date().toISOString() } = {}) {
  let parsedUrl;
  try {
    parsedUrl = new URL(article?.url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;
  } catch { return null; }
  parsedUrl.hash = '';
  for (const key of [...parsedUrl.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) parsedUrl.searchParams.delete(key);
  }
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
  if (parsedUrl.pathname.length > 1) parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');
  const title = String(article.title || '').trim().slice(0, 400);
  if (!title) return null;
  const category = categoryCatalog[categoryId];
  const publishedAt = parseGdeltDate(article.seendate);
  const domain = String(article.domain || parsedUrl.hostname).toLowerCase().replace(/^www\./, '');
  const source = {
    id: createHash('sha256').update(parsedUrl.toString()).digest('hex').slice(0, 24),
    title,
    url: parsedUrl.toString(),
    domain,
    publishedAt,
    language: String(article.language || '').slice(0, 40),
    sourceCountry: String(article.sourcecountry || '').slice(0, 60),
    socialImage: safeImageUrl(article.socialimage),
    imageType: article.socialimage ? 'social_image' : null,
    imageSource: article.socialimage ? 'GDELT article metadata' : null,
    credit: '',
    rightsStatus: article.socialimage ? 'CHECK_REQUIRED' : 'NO_IMAGE',
    rightsNotes: article.socialimage ? 'GDELT metadata is not a licence. Rights must be checked before publication.' : '',
    verificationStatus: 'UNVERIFIED',
    level: sourceLevel(domain),
    independence: 'UNKNOWN',
    queryUsed: query,
    retrievedAt,
    rawMetadata: article,
  };
  return { source, canonicalUrl: source.url, category: category.category, subcategory: category.subcategory, categoryId };
}

export function parseGdeltDate(value) {
  const match = String(value || '').match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})Z?$/);
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeImageUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

function sourceLevel(domain) {
  const host = String(domain || '').toLowerCase().replace(/^www\./, '');
  const official = ['uefa.com', 'fifa.com', 'premierleague.com', 'laliga.com', 'bundesliga.com', 'nba.com', 'wnba.com', 'euroleaguebasketball.net', 'world.rugby', 'lnr.fr'];
  const recognized = ['reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'lemonde.fr', 'theguardian.com', 'espn.com', 'france24.com'];
  if (['x.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'facebook.com'].some((item) => host === item || host.endsWith(`.${item}`))) return 'D_SOCIAL_SIGNAL';
  if (official.some((item) => host === item || host.endsWith(`.${item}`))) return 'A_PRIMARY_CANDIDATE';
  if (recognized.some((item) => host === item || host.endsWith(`.${item}`))) return 'B_RECOGNIZED_CANDIDATE';
  return 'UNASSESSED';
}

function validateRange({ timespan, startDate, endDate }) {
  if (startDate || endDate) {
    const parse = (value) => /^\d{14}$/.test(String(value)) ? value : null;
    const start = startDate ? parse(startDate) : null;
    const end = endDate ? parse(endDate) : null;
    if ((startDate && !start) || (endDate && !end)) throw new Error('Les dates doivent être au format GDELT YYYYMMDDHHMMSS.');
    if (start && end && start >= end) throw new Error('La date de début doit précéder la date de fin.');
    const earliest = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    if (start && new Date(`${start.slice(0,4)}-${start.slice(4,6)}-${start.slice(6,8)}T${start.slice(8,10)}:${start.slice(10,12)}:${start.slice(12,14)}Z`) < earliest) throw new Error('GDELT DOC limite cette recherche à sa fenêtre historique disponible.');
    return { startDate: start, endDate: end };
  }
  const allowed = new Set(['1h', '3h', '6h', '12h', '24h', '3d', '1w', '2w', '1m', '3m']);
  const selected = allowed.has(String(timespan)) ? String(timespan) : '24h';
  return { timespan: selected };
}

export function buildGdeltUrl(query, options = {}) {
  const maxRecords = Math.max(1, Math.min(MAX_RECORDS, Number(options.maxRecords) || 75));
  const params = new URLSearchParams({ query, mode: 'artlist', maxrecords: String(maxRecords), sort: options.sort === 'dateasc' ? 'dateasc' : 'datedesc', format: 'json' });
  const range = validateRange(options);
  if (range.timespan) params.set('timespan', range.timespan);
  if (range.startDate) params.set('startdatetime', range.startDate);
  if (range.endDate) params.set('enddatetime', range.endDate);
  return `${API_URL}?${params.toString()}`;
}

export async function fetchGdeltWave({ query, options, db, fetchImpl = fetch }) {
  const cacheKey = createHash('sha256').update(JSON.stringify({ query, options })).digest('hex');
  const cacheRef = db.collection('newsroomGdeltCache').doc(cacheKey);
  const cached = await cacheRef.get();
  if (cached.exists && Date.now() - Date.parse(cached.data().cachedAt) < CACHE_TTL_MS) return { ...cached.data().result, cacheHit: true };
  const response = await fetchImpl(buildGdeltUrl(query, options), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`GDELT returned HTTP ${response.status}.`);
  const json = await response.json();
  if (!json || !Array.isArray(json.articles)) throw new Error('GDELT returned an invalid ArticleList response.');
  const result = { articles: json.articles, query, total: json.articles.length };
  await cacheRef.set({ cachedAt: new Date().toISOString(), result });
  return { ...result, cacheHit: false };
}

export async function searchCategory({ categoryId, options = {}, db }) {
  const category = categoryCatalog[categoryId];
  if (!category) throw new Error('Catégorie éditoriale inconnue.');
  const language = String(options.language || '').toLowerCase().replace(/[^a-z-]/g, '').slice(0, 24);
  const country = String(options.sourceCountry || '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 40);
  const filters = [language ? `sourcelang:${language}` : '', country ? `sourcecountry:${country}` : ''].filter(Boolean).join(' ');
  const waves = category.keywords.map((terms) => `(${terms.map((term) => `(${term})`).join(' ')}) ${filters}`.trim());
  const results = await Promise.allSettled(waves.map((query) => fetchGdeltWave({ query, options, db })));
  const retrievedAt = new Date().toISOString();
  const items = results.flatMap((result) => result.status === 'fulfilled'
    ? result.value.articles.map((article) => normalizeGdeltArticle(article, { categoryId, query: result.value.query, retrievedAt })).filter(Boolean)
    : []);
  const unique = deduplicateByUrl(items);
  const errors = results.filter((item) => item.status === 'rejected').map((item) => item.reason?.message || 'GDELT request failed.');
  if (!unique.length && errors.length === results.length) throw new Error('GDELT TEMPORARILY UNAVAILABLE');
  return { items: unique, waves: results.length, successfulWaves: results.length - errors.length, errors, retrievedAt };
}

export function normalizeTitle(value) {
  const stopwords = new Set(['the','a','an','and','or','of','to','in','on','for','with','by','le','la','les','de','des','du','un','une','et','en','pour','avec','sur','au','aux','dans']);
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter((word) => word.length > 2 && !stopwords.has(word));
}

export function titleSimilarity(left, right) {
  const a = new Set(normalizeTitle(left));
  const b = new Set(normalizeTitle(right));
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const word of a) if (b.has(word)) common += 1;
  if (common < 3) return 0;
  return common / new Set([...a, ...b]).size;
}

export function deduplicateByUrl(items) {
  const byUrl = new Map();
  for (const item of items) {
    const existing = byUrl.get(item.canonicalUrl);
    if (existing) existing.source.queryUsed = [...new Set([existing.source.queryUsed, item.source.queryUsed])].filter(Boolean).join(' · ');
    else byUrl.set(item.canonicalUrl, item);
  }
  const unique = [...byUrl.values()];
  return unique;
}
