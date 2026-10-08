const rateLimit = require("express-rate-limit");
const { getMatches, getMatch, getStandings } = require("./service.cjs");
const { enabledCompetitions, liveRefreshIntervalMs } = require("./config.cjs");
const { getSportsProvider } = require("./provider.cjs");
const { SportsError, publicError } = require("./errors.cjs");

function installSportsRoutes(app, { db }) {
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMIT", message: "Trop de demandes sportives. Réessaie dans un instant." } },
  });
  app.use("/sports", limiter);

  const handle = (work) => async (req, res) => {
    res.set("Cache-Control", "public, max-age=8, stale-while-revalidate=15");
    try {
      const result = await work(req);
      return res.status(200).json({ data: result.data, meta: {
        lastUpdated: result.meta?.lastUpdated || null,
        stale: Boolean(result.meta?.stale),
        state: result.state || (result.meta?.stale ? "stale" : "available"),
        provider: result.provider || null,
        refreshIntervalMs: liveRefreshIntervalMs,
        message: result.message || null,
      } });
    } catch (error) {
      const known = error instanceof SportsError;
      const safe = publicError(error);
      if (!known) console.error(`Sports data failure code=${safe.code}`);
      return res.status(known ? error.status : 502).json({ data: null, error: safe, meta: { lastUpdated: null, provider: null, stale: false } });
    }
  };

  app.get("/sports/live", handle((req) => getMatches(db, "live", queryFilters(req))));
  app.get("/sports/results", handle((req) => getMatches(db, "results", queryFilters(req))));
  app.get("/sports/schedule", handle((req) => getMatches(db, "schedule", queryFilters(req))));
  app.get("/sports/standings", handle((req) => getStandings(db, queryFilters(req))));
  app.get("/sports/matches/:matchId", handle((req) => getMatch(db, req.params.matchId)));
  app.get("/sports/competitions", handle(async () => {
    const provider = getSportsProvider();
    if (typeof provider.getCompetitions !== "function") throw new SportsError("PROVIDER_NOT_CONFIGURED");
    const competitions = await provider.getCompetitions();
    if (!Array.isArray(competitions)) throw new SportsError("INVALID_RESPONSE");
    const enabled = new Set(Object.values(enabledCompetitions).flat().filter((item) => item.enabled && item.providerId).map((item) => String(item.providerId)));
    return { data: competitions.filter((item) => enabled.has(String(item.id))), meta: { lastUpdated: new Date().toISOString(), stale: false }, provider: process.env.SPORTS_PROVIDER || null };
  }));
}

function queryFilters(req) {
  const { sport, competition, status, date } = req.query;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new SportsError("MISSING_DATA");
  return {
    ...(sport ? { sport: String(sport).slice(0, 30) } : {}),
    ...(competition ? { competition: String(competition).slice(0, 80) } : {}),
    ...(status ? { status: String(status).slice(0, 20) } : {}),
    ...(date ? { date: String(date) } : {}),
  };
}

module.exports = installSportsRoutes;
