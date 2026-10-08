const enabledCompetitions = Object.freeze({
  football: Object.freeze([
    { key: "ligue-1", label: "Ligue 1", providerId: null, enabled: true, featured: true },
    { key: "premier-league", label: "Premier League", providerId: null, enabled: true, featured: true },
    { key: "la-liga", label: "LaLiga", providerId: null, enabled: true, featured: false },
    { key: "serie-a", label: "Serie A", providerId: null, enabled: true, featured: false },
    { key: "bundesliga", label: "Bundesliga", providerId: null, enabled: true, featured: false },
    { key: "champions-league", label: "Ligue des Champions", providerId: null, enabled: true, featured: true },
  ]),
  basketball: Object.freeze([
    { key: "nba", label: "NBA", providerId: null, enabled: true, featured: true },
    { key: "euroleague", label: "EuroLeague", providerId: null, enabled: true, featured: false },
    { key: "betclic-elite", label: "Betclic Élite", providerId: null, enabled: true, featured: false },
  ]),
  rugby: Object.freeze([
    { key: "top-14", label: "Top 14", providerId: null, enabled: true, featured: true },
    { key: "premiership-rugby", label: "Premiership Rugby", providerId: null, enabled: true, featured: false },
    { key: "champions-cup", label: "Champions Cup", providerId: null, enabled: true, featured: false },
  ]),
});

const positiveNumber = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

module.exports = {
  enabledCompetitions,
  liveRefreshIntervalMs: positiveNumber(process.env.LIVE_REFRESH_INTERVAL, 60_000),
  cacheTtlMs: positiveNumber(process.env.SPORTS_CACHE_TTL_MS, 55_000),
  staleAfterMs: positiveNumber(process.env.SPORTS_STALE_AFTER_MS, 180_000),
  apiTimeoutMs: positiveNumber(process.env.SPORTS_API_TIMEOUT_MS, 8_000),
  mockMode: process.env.SPORTS_MOCK_MODE === "true" && process.env.NODE_ENV !== "production",
};
