/** Provider-independent GETSTARVIS sports data model. */
export const SPORT_IDS = Object.freeze(["football", "basketball", "rugby"]);
export const MATCH_STATUSES = Object.freeze(["live", "upcoming", "finished", "postponed", "cancelled", "suspended", "unknown"]);

/**
 * @typedef {{ id: string, name: string, logoUrl: string|null, shortName: string|null }} Team
 * @typedef {{ id: string|null, name: string, country: string|null, logoUrl: string|null }} Competition
 * @typedef {{ home: number|null, away: number|null }} Score
 * @typedef {{ id: string, type: string, label: string, elapsed: number|null, teamId: string|null, player: string|null, detail: string|null }} MatchEvent
 * @typedef {{ id: string, sport: string, competition: Competition, homeTeam: Team, awayTeam: Team, score: Score, status: string, period: string|null, minute: number|null, clock: string|null, startTime: string|null, events: MatchEvent[], statistics: object|null, lineups: object|null, standings: object|null, lastUpdated: string|null, provider: string|null, providerMatchId: string|null }} Match
 */

export function matchStatusLabel(status) {
  return ({ live: "En direct", upcoming: "À venir", finished: "Terminé", postponed: "Reporté", cancelled: "Annulé", suspended: "Suspendu", unknown: "Statut indisponible" })[status] || "Statut indisponible";
}

export function scoreLabel(score) {
  const home = Number.isFinite(score?.home) ? score.home : "–";
  const away = Number.isFinite(score?.away) ? score.away : "–";
  return `${home} – ${away}`;
}
