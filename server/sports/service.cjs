const { enabledCompetitions, cacheTtlMs, staleAfterMs } = require("./config.cjs");
const { readThroughCache } = require("./cache.cjs");
const { getSportsProvider } = require("./provider.cjs");
const { SportsError } = require("./errors.cjs");

const ALLOWED_SPORTS = new Set(Object.keys(enabledCompetitions));

function filterMatches(matches, filters = {}) {
  const sport = filters.sport ? String(filters.sport).toLowerCase() : null;
  if (sport && !ALLOWED_SPORTS.has(sport)) throw new SportsError("UNKNOWN_SPORT");
  const competition = filters.competition ? String(filters.competition) : null;
  const status = filters.status ? String(filters.status) : null;
  const filtered = matches.filter((match) => (!sport || match.sport === sport)
    && (!competition || match.competition?.id === competition || match.competition?.slug === competition)
    && (!status || match.status === status));
  return filtered;
}

async function readProvider(db, dataset, providerMethod, params = {}) {
  const provider = getSportsProvider();
  if (typeof provider[providerMethod] !== "function") throw new SportsError("PROVIDER_NOT_CONFIGURED");
  const result = await readThroughCache({
    db, key: `${dataset}:${params.sport || "all"}:${params.date || "current"}`,
    ttlMs: cacheTtlMs, staleAfterMs,
    loader: async () => {
      const records = await provider[providerMethod](params);
      if (!Array.isArray(records)) throw new SportsError("INVALID_RESPONSE");
      return records;
    },
  });
  return { ...result, provider: process.env.SPORTS_PROVIDER || null };
}

async function getMatches(db, kind, filters = {}) {
  const method = ({ live: "getLiveMatches", results: "getFinishedMatches", schedule: "getUpcomingMatches" })[kind];
  if (!method) throw new SportsError("API_ERROR");
  const result = await readProvider(db, kind, method, filters);
  const matches = filterMatches(result.data, filters);
  if (kind === "live" && result.meta.stale) {
    return { ...result, data: [], state: "stale", message: "Les données disponibles sont trop anciennes pour être présentées comme du direct." };
  }
  return { ...result, data: matches, state: matches.length ? "available" : "empty" };
}

async function getMatch(db, matchId) {
  if (!matchId || String(matchId).length > 160) throw new SportsError("MISSING_DATA");
  const provider = getSportsProvider();
  if (typeof provider.getMatch !== "function") throw new SportsError("PROVIDER_NOT_CONFIGURED");
  const result = await readThroughCache({
    db, key: `match:${String(matchId)}`, ttlMs: cacheTtlMs, staleAfterMs,
    loader: async () => {
      const match = await provider.getMatch(String(matchId));
      if (!match || typeof match !== "object") throw new SportsError("MISSING_DATA");
      return match;
    },
  });
  return { ...result, provider: process.env.SPORTS_PROVIDER || null };
}

async function getStandings(db, filters = {}) {
  const result = await readProvider(db, "standings", "getStandings", filters);
  return { ...result, data: result.data, state: result.data.length ? "available" : "empty" };
}

module.exports = { getMatches, getMatch, getStandings, filterMatches };
