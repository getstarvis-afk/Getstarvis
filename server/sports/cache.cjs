const { randomUUID } = require("node:crypto");
const { SportsError } = require("./errors.cjs");

const COLLECTION = "_getstarvisSportsCache";
const localCache = new Map();

function cacheResult(entry, now, { shared, staleAfterMs }) {
  if (!entry?.data) return null;
  const fetchedAt = Number(entry.fetchedAt || 0);
  return {
    data: entry.data,
    meta: {
      lastUpdated: fetchedAt ? new Date(fetchedAt).toISOString() : null,
      stale: !fetchedAt || now - fetchedAt > staleAfterMs,
      cache: shared ? "shared" : "instance",
    },
  };
}

async function readThroughCache({ db, key, ttlMs, staleAfterMs, loader }) {
  const now = Date.now();
  if (!db) {
    const entry = localCache.get(key);
    if (entry && now - entry.fetchedAt < ttlMs) return cacheResult(entry, now, { shared: false, staleAfterMs });
    throw new SportsError("PROVIDER_NOT_CONFIGURED");
  }

  const ref = db.collection(COLLECTION).doc(key);
  const leaseId = randomUUID();
  let decision;
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const entry = snapshot.exists ? snapshot.data() : {};
    if (entry.payload && Number(entry.expiresAt) > now) {
      decision = { kind: "cached", entry: { data: entry.payload, fetchedAt: entry.fetchedAt } };
      return;
    }
    if (Number(entry.lockUntil) > now) {
      decision = { kind: "waiting", entry: { data: entry.payload, fetchedAt: entry.fetchedAt } };
      return;
    }
    transaction.set(ref, { ...entry, lockId: leaseId, lockUntil: now + 20_000 }, { merge: true });
    decision = { kind: "refresh", entry: { data: entry.payload, fetchedAt: entry.fetchedAt } };
  });

  if (decision.kind === "cached") return cacheResult(decision.entry, now, { shared: true, staleAfterMs });
  if (decision.kind === "waiting") {
    const stale = cacheResult(decision.entry, now, { shared: true, staleAfterMs });
    if (stale) return stale;
    throw new SportsError("CACHE_REFRESHING");
  }

  try {
    const data = await loader();
    const fetchedAt = Date.now();
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.data()?.lockId !== leaseId) return;
      transaction.set(ref, { payload: data, fetchedAt, expiresAt: fetchedAt + ttlMs, lockId: null, lockUntil: 0 });
    });
    return cacheResult({ data, fetchedAt }, fetchedAt, { shared: true, staleAfterMs });
  } catch (error) {
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.data()?.lockId === leaseId) transaction.set(ref, { lockId: null, lockUntil: 0 }, { merge: true });
    }).catch(() => {});
    const stale = cacheResult(decision.entry, Date.now(), { shared: true, staleAfterMs });
    if (stale) return stale;
    throw error;
  }
}

module.exports = { readThroughCache };
