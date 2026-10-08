const pick = (object, ...keys) => keys.map((key) => object?.[key]).find((value) => value !== undefined && value !== null);
const text = (value, fallback = null) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const finite = (value) => value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;

export function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (["live", "in_play", "inplay", "in progress", "1h", "2h", "ht", "q1", "q2", "q3", "q4", "period 1", "period 2"].includes(status)) return "live";
  if (["scheduled", "upcoming", "not started", "ns", "fixture", "tbd"].includes(status)) return "upcoming";
  if (["finished", "ft", "full time", "ended", "complete", "completed", "aet", "pen"].includes(status)) return "finished";
  if (status.includes("postpon")) return "postponed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("suspend")) return "suspended";
  return "unknown";
}

export function normalizeTeam(raw, idFallback = "unknown") {
  const team = raw && typeof raw === "object" ? raw : {};
  return {
    id: String(pick(team, "id", "teamId", "team_id") ?? idFallback),
    name: text(pick(team, "name", "teamName", "team_name", "displayName"), "Équipe inconnue"),
    shortName: text(pick(team, "shortName", "short_name", "abbreviation", "code")),
    logoUrl: text(pick(team, "logoUrl", "logo", "image", "crest")),
  };
}

export function normalizeCompetition(raw) {
  const competition = raw && typeof raw === "object" ? raw : {};
  return {
    id: pick(competition, "id", "competitionId", "competition_id", "leagueId", "league_id") == null ? null : String(pick(competition, "id", "competitionId", "competition_id", "leagueId", "league_id")),
    name: text(pick(competition, "name", "competitionName", "competition_name", "leagueName", "league_name"), "Compétition inconnue"),
    country: text(pick(competition, "country", "region", "area")),
    logoUrl: text(pick(competition, "logoUrl", "logo", "image", "flag")),
  };
}

export function normalizeEvent(raw, index = 0) {
  const event = raw && typeof raw === "object" ? raw : {};
  const time = pick(event, "elapsed", "minute", "time", "periodTime");
  const player = pick(event, "player", "athlete", "scorer");
  return {
    id: String(pick(event, "id", "eventId", "event_id") ?? `event-${index}`),
    type: text(pick(event, "type", "kind", "code"), "unknown"),
    label: text(pick(event, "label", "detail", "type"), "Événement"),
    elapsed: finite(typeof time === "object" ? pick(time, "elapsed", "minute", "value") : time),
    teamId: pick(event, "teamId", "team_id", "team") == null ? null : String(pick(event, "teamId", "team_id", "team")),
    player: text(typeof player === "object" ? pick(player, "name", "displayName") : player),
    detail: text(pick(event, "detail", "comments", "description")),
  };
}

export function normalizeMatch(raw, { provider = null, sportFallback = "unknown" } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("INVALID_RESPONSE");
  const home = pick(raw, "homeTeam", "home_team", "home", "team_home");
  const away = pick(raw, "awayTeam", "away_team", "away", "team_away");
  const scores = pick(raw, "score", "scores", "result") || {};
  const homeScore = pick(raw, "homeScore", "home_score") ?? pick(scores, "home", "homeScore", "home_score") ?? pick(typeof scores === "object" ? scores.home : null, "score", "total");
  const awayScore = pick(raw, "awayScore", "away_score") ?? pick(scores, "away", "awayScore", "away_score") ?? pick(typeof scores === "object" ? scores.away : null, "score", "total");
  const competitionRaw = pick(raw, "competition", "league", "tournament") || {};
  const statusRaw = pick(raw, "status", "state", "matchStatus", "match_status");
  const eventList = pick(raw, "events", "incidents", "timeline");
  const id = pick(raw, "id", "matchId", "match_id", "fixtureId", "fixture_id");

  if (!home || !away || id == null) throw new TypeError("MISSING_DATA");
  const teamId = (value) => value && typeof value === "object" ? pick(value, "id", "teamId", "team_id") : value;
  const periodRaw = pick(raw, "period", "periodName", "period_name", "quarter", "half");
  const clockRaw = pick(raw, "clock", "timeRemaining", "time_remaining");
  const updated = pick(raw, "lastUpdated", "last_updated", "updatedAt", "updated_at");

  return {
    id: String(id), providerMatchId: String(id), provider,
    sport: text(pick(raw, "sport", "sportType", "sport_type"), sportFallback).toLowerCase(),
    competition: normalizeCompetition(competitionRaw),
    homeTeam: normalizeTeam(home, String(teamId(home) ?? "home-unknown")),
    awayTeam: normalizeTeam(away, String(teamId(away) ?? "away-unknown")),
    score: { home: finite(homeScore), away: finite(awayScore) },
    status: normalizeStatus(statusRaw),
    period: typeof periodRaw === "object" ? text(pick(periodRaw, "name", "label", "shortName")) : text(periodRaw),
    minute: finite(pick(raw, "minute", "elapsed", "elapsedTime", "elapsed_time")),
    clock: typeof clockRaw === "object" ? text(pick(clockRaw, "display", "value", "text")) : text(clockRaw),
    startTime: text(pick(raw, "startTime", "start_time", "date", "kickoff", "scheduledAt")),
    events: Array.isArray(eventList) ? eventList.map(normalizeEvent).sort((a, b) => (a.elapsed ?? 0) - (b.elapsed ?? 0)) : [],
    statistics: pick(raw, "statistics", "stats") ?? null,
    lineups: pick(raw, "lineups", "formations") ?? null,
    standings: pick(raw, "standings", "table") ?? null,
    lastUpdated: text(updated),
  };
}

export function normalizeMatches(payload, options) {
  const list = Array.isArray(payload) ? payload : pick(payload, "matches", "fixtures", "events", "data");
  if (!Array.isArray(list)) throw new TypeError("INVALID_RESPONSE");
  const seen = new Set();
  return list.map((item) => normalizeMatch(item, options)).filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
