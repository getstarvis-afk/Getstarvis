import { createHash, randomUUID } from 'node:crypto';
import { categoryCatalog } from './catalog.js';
import { deduplicateByUrl, titleSimilarity } from './gdelt.js';
import { getNewsProvider } from './providers/GdeltProvider.js';

const ITEMS = 'newsroomItems';
const EXECUTIONS = 'newsroomExecutions';
const AUDIT = 'newsroomAudit';
const RATE_LIMIT_MS = 12_000;

export async function runCategorySearch({ uid, email, categoryId, options, db }) {
  const category = categoryCatalog[categoryId];
  if (!category) throw Object.assign(new Error('Rubrique inconnue.'), { status: 400, code: 'UNKNOWN_CATEGORY' });
  const now = Date.now();
  const limiterRef = db.collection('newsroomRateLimits').doc(uid);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(limiterRef);
    const last = Number(snapshot.data()?.lastSearchAt || 0);
    if (now - last < RATE_LIMIT_MS) throw Object.assign(new Error('Attends quelques secondes avant de relancer une recherche.'), { status: 429, code: 'SEARCH_RATE_LIMIT' });
    transaction.set(limiterRef, { lastSearchAt: now }, { merge: true });
  });

  const executionId = randomUUID();
  const executionRef = db.collection(EXECUTIONS).doc(executionId);
  const startedAt = new Date().toISOString();
  await executionRef.set({ id: executionId, status: 'RUNNING', categoryId, category: category.category, subcategory: category.subcategory, startedAt, startedBy: email, timespan: options.timespan || null, requestedMaxRecords: options.maxRecords, resultCount: 0, createdAt: startedAt });
  try {
    const provider = getNewsProvider();
    const search = await provider.searchCategory({ categoryId, options, db });
    const latest = await db.collection(ITEMS).orderBy('updatedAt', 'desc').limit(400).get();
    const priorItems = latest.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const allCandidates = deduplicateByUrl(search.items);
    const clusters = clusterResults(allCandidates);
    let newSubjects = 0;
    let updates = 0;
    const batch = db.batch();
    const nowIso = new Date().toISOString();
    for (const cluster of clusters) {
      const matched = matchExisting(cluster, priorItems);
      const sources = mergeSources(matched?.sources || [], cluster.flatMap((candidate) => [candidate.source]));
      const source = sources.sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || '')).at(-1) || cluster[0].source;
      const contentHash = createHash('sha256').update(cluster.map((item) => item.canonicalUrl).sort().join('\n')).digest('hex');
      const id = matched?.id || contentHash.slice(0, 28);
      const existingSourceUrls = new Set((matched?.sources || []).map((item) => item.url));
      const changed = Boolean(matched && sources.some((item) => !existingSourceUrls.has(item.url)));
      if (!matched) newSubjects += 1; else if (changed) updates += 1;
      const item = matched ? {
        ...matched,
        sources,
        lastSeenAt: nowIso,
        lastChangedAt: changed ? nowIso : (matched.lastChangedAt || nowIso),
        changeType: changed ? 'UPDATE' : matched.changeType || 'WATCH',
        runIds: [...new Set([...(matched.runIds || []), executionId])].slice(-30),
        updatedAt: nowIso,
      } : {
        id, categoryId, category: cluster[0].category, subcategory: cluster[0].subcategory,
        sourceTitle: source.title, title: '', standfirst: '', articleBody: '', context: '', whyItMatters: '', whatWeKnow: '', whatToConfirm: '',
        sources, sourceDomains: [...new Set(sources.map((entry) => entry.domain))], status: 'VERIFYING', starverify: 'PENDING', confidence: null,
        duplicateCount: Math.max(0, cluster.length - 1), duplicateUrls: cluster.slice(1).map((entry) => entry.canonicalUrl), changeType: 'NEW',
        firstSeenAt: nowIso, lastSeenAt: nowIso, lastChangedAt: nowIso, runIds: [executionId], image: source.socialImage ? {
          imageUrl: source.socialImage, articleUrl: source.url, sourceUrl: source.url, sourceDomain: source.domain,
          imageType: 'social_image', imageSource: 'GDELT article metadata', credit: '', publicationDate: source.publishedAt,
          imageDateIfKnown: null, rightsStatus: 'CHECK_REQUIRED', rightsNotes: 'GDELT ne confère pas de droits de republication.',
          altText: '', caption: '', recommendedUse: 'NEWSROOM_PREVIEW_ONLY', verificationStatus: 'UNVERIFIED', gdeltImageReference: null,
        } : null,
        createdAt: nowIso, updatedAt: nowIso,
      };
      batch.set(db.collection(ITEMS).doc(id), item, { merge: true });
    }
    const finishedAt = new Date().toISOString();
    const counts = { rawResults: search.items.length, uniqueResults: allCandidates.length, clusters: clusters.length, newSubjects, updates, duplicates: Math.max(0, search.items.length - allCandidates.length), partial: search.successfulWaves < search.waves, successfulWaves: search.successfulWaves, waves: search.waves, errors: search.errors };
    batch.set(executionRef, { status: 'COMPLETED', finishedAt, resultCount: clusters.length, counts, retrievedAt: search.retrievedAt }, { merge: true });
    batch.create(db.collection(AUDIT).doc(randomUUID()), { action: 'SEARCH_COMPLETED', executionId, categoryId, actorUid: uid, actorEmail: email, createdAt: finishedAt, details: counts });
    await batch.commit();
    return { executionId, counts, items: clusters.length, status: 'COMPLETED' };
  } catch (error) {
    await executionRef.set({ status: 'FAILED', finishedAt: new Date().toISOString(), errorCode: 'GDELT_UNAVAILABLE', errorMessage: 'GDELT TEMPORARILY UNAVAILABLE' }, { merge: true });
    throw error;
  }
}

export function clusterResults(items) {
  const clusters = [];
  for (const item of items) {
    const cluster = clusters.find((group) => group.some((current) => titleSimilarity(current.source.title, item.source.title) >= 0.66));
    if (cluster) cluster.push(item); else clusters.push([item]);
  }
  return clusters;
}

function matchExisting(cluster, previous) {
  const urls = new Set(cluster.map((item) => item.canonicalUrl));
  const titles = cluster.map((item) => item.source.title);
  return previous.find((item) => (item.sources || []).some((source) => urls.has(source.url)))
    || previous.find((item) => item.categoryId === cluster[0].categoryId && titles.some((title) => titleSimilarity(title, item.sourceTitle || item.title) >= 0.78));
}

function mergeSources(existing, incoming) {
  const byUrl = new Map(existing.map((source) => [source.url, source]));
  for (const source of incoming) if (!byUrl.has(source.url)) byUrl.set(source.url, source);
  return [...byUrl.values()].slice(0, 24);
}

export async function listNewsroomData({ db }) {
  const [itemsSnap, executionsSnap, auditSnap] = await Promise.all([
    db.collection(ITEMS).orderBy('updatedAt', 'desc').limit(120).get(),
    db.collection(EXECUTIONS).orderBy('startedAt', 'desc').limit(12).get(),
    db.collection(AUDIT).orderBy('createdAt', 'desc').limit(30).get(),
  ]);
  const items = itemsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const executions = executionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const audit = auditSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { items, executions, audit, categories: categoryCatalog, stats: {
    candidates: items.length, newSubjects: items.filter((item) => item.changeType === 'NEW').length,
    updates: items.filter((item) => item.changeType === 'UPDATE').length,
    verified: items.filter((item) => item.starverify === 'VERIFIED').length,
    verifying: items.filter((item) => item.starverify === 'PENDING').length,
    rejected: items.filter((item) => item.status === 'REJECTED').length,
    withImage: items.filter((item) => item.image?.imageUrl).length,
    ready: items.filter((item) => item.status === 'READY_FOR_REVIEW').length,
  } };
}


export async function listNewsroomAudit({ db }) {
  const snapshot = await db.collection(AUDIT).orderBy('createdAt', 'desc').limit(60).get();
  return { audit: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) };
}
