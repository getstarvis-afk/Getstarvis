import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CalendarDays, CircleHelp, RefreshCw, ShieldCheck } from "lucide-react";
import { getSportsData } from "../../lib/sports/api.js";
import { matchStatusLabel, scoreLabel } from "../../lib/sports/types.js";

const REFRESH_FALLBACK_MS = 30_000;
const sportLabels = { football: "Football", basketball: "Basketball", rugby: "Rugby" };
const displayTime = (date) => date ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(date)) : null;

function useSportsResource(path, { poll = false, params = {} } = {}) {
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let active = true;
    let timer;
    const controller = new AbortController();
    const load = async () => {
      try {
        const result = await getSportsData(path, { params: JSON.parse(paramsKey), signal: controller.signal });
        if (!active) return;
        setPayload(result);
        setError(null);
        if (poll) timer = window.setTimeout(load, Math.max(15_000, Number(result.meta?.refreshIntervalMs) || REFRESH_FALLBACK_MS));
      } catch (requestError) {
        if (!active || requestError.name === "AbortError") return;
        setError(requestError);
        if (poll) timer = window.setTimeout(load, REFRESH_FALLBACK_MS);
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [path, paramsKey, poll, refreshToken]);

  return { payload, error, loading, refresh: () => setRefreshToken((value) => value + 1) };
}

export function LiveIndicator() { return <span className="sports-live-indicator"><span aria-hidden="true" /> LIVE</span>; }

export function MatchStatus({ match }) {
  if (match?.status === "live") return <span className="sports-match-status"><LiveIndicator /> {match.period || (match.minute != null ? `${match.minute}’` : match.clock || "En cours")}</span>;
  return <span className="sports-match-status">{matchStatusLabel(match?.status)}{match?.period ? ` · ${match.period}` : ""}</span>;
}

export function LiveScore({ match }) {
  return <div className="sports-score" aria-label={`Score ${match.homeTeam.name} ${match.score.home ?? "indisponible"}, ${match.awayTeam.name} ${match.score.away ?? "indisponible"}`}>
    <span>{Number.isFinite(match.score.home) ? match.score.home : "–"}</span><i aria-hidden="true">–</i><span>{Number.isFinite(match.score.away) ? match.score.away : "–"}</span>
  </div>;
}

export function TeamCard({ team }) {
  return <div className="sports-team-card">{team.logoUrl ? <img src={team.logoUrl} alt="" loading="lazy" /> : <span className="sports-team-placeholder" aria-hidden="true">{team.name.slice(0, 1)}</span>}<span>{team.name}</span></div>;
}

export function CompetitionHeader({ competition, sport }) {
  return <div className="sports-competition-header">{competition?.logoUrl && <img src={competition.logoUrl} alt="" loading="lazy" />}<span>{competition?.name || "Compétition indisponible"}</span>{competition?.country && <small>{competition.country}</small>}<span className="sports-competition-sport">{sportLabels[sport] || sportLabels[sport?.toLowerCase()] || "Sport"}</span></div>;
}

export function LastUpdated({ value, stale = false }) {
  const time = value ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Paris" }).format(new Date(value)) : null;
  return <span className={`sports-last-updated ${stale ? "is-stale" : ""}`}><span aria-hidden="true" />{stale ? "Données possiblement obsolètes" : "Données actualisées"}{time ? ` · ${time}` : ""}</span>;
}

export function DataSourceBadge({ provider }) { return provider ? <span className="sports-source">Source des données sportives : {provider}</span> : null; }

export function MatchEvent({ event }) { return <li><time>{event.elapsed == null ? "–" : `${event.elapsed}’`}</time><span>{event.label}</span>{event.player && <strong>{event.player}</strong>}{event.detail && <small>{event.detail}</small>}</li>; }

export function MatchTimeline({ events }) {
  return <section className="sports-detail-panel"><h2>Événements</h2>{events?.length ? <ol className="sports-timeline">{events.map((event) => <MatchEvent event={event} key={event.id} />)}</ol> : <p>Information non disponible.</p>}</section>;
}

export function LiveStats({ statistics }) {
  const rows = Array.isArray(statistics) ? statistics : statistics && typeof statistics === "object" ? Object.entries(statistics).map(([name, value]) => ({ name, value })) : [];
  return <section className="sports-detail-panel"><h2>Statistiques</h2>{rows.length ? <dl className="sports-stats">{rows.map((item, index) => <div key={`${item.name || item.type}-${index}`}><dt>{item.name || item.type || "Statistique"}</dt><dd>{item.value ?? item.home ?? "–"}{item.away != null ? ` – ${item.away}` : ""}</dd></div>)}</dl> : <p>Information non disponible.</p>}</section>;
}

export function Lineups({ lineups }) { return <section className="sports-detail-panel"><h2>Compositions</h2>{lineups ? <pre className="sports-data-block">{JSON.stringify(lineups, null, 2)}</pre> : <p>Information non disponible.</p>}</section>; }

export function LiveMatchCard({ match, updatedAt, stale = false }) {
  return <article className="sports-match-card"><CompetitionHeader competition={match.competition} sport={match.sport} /><div className="sports-card-status"><MatchStatus match={match} /><span>{match.status === "upcoming" ? displayTime(match.startTime) || "Horaire indisponible" : match.period || ""}</span></div><div className="sports-match-versus"><TeamCard team={match.homeTeam} /><LiveScore match={match} /><TeamCard team={match.awayTeam} /></div><div className="sports-match-card-footer"><LastUpdated value={updatedAt || match.lastUpdated} stale={stale} /><Link to={`/sport/live/${encodeURIComponent(match.id)}`} aria-label={`Détails du match ${match.homeTeam.name} contre ${match.awayTeam.name}`}>Détails <ArrowRight size={14} /></Link></div></article>;
}

export function UpcomingMatchCard(props) { return <LiveMatchCard {...props} />; }
export function FinishedMatchCard(props) { return <LiveMatchCard {...props} />; }

export function LiveLoadingState() { return <div className="sports-state" role="status"><RefreshCw className="sports-spin" size={20} />Chargement des données sportives…</div>; }
export function LiveEmptyState({ message = "Aucun match disponible pour ces filtres." }) { return <div className="sports-state"><CircleHelp size={22} /><strong>{message}</strong><span>Aucun score n’est affiché sans données vérifiables.</span></div>; }
export function LiveErrorState({ message, onRetry }) { return <div className="sports-state sports-error-state" role="alert"><ShieldCheck size={22} /><strong>{message || "Les données en direct sont momentanément indisponibles."}</strong><span>GETSTARVIS n’affiche aucun score sans source de données valide.</span>{onRetry && <button className="sports-retry" onClick={onRetry} type="button"><RefreshCw size={14} /> Réessayer</button>}</div>; }

export function SportFilter({ value, onChange, matches = [] }) {
  const sports = [...new Set(matches.map((match) => match.sport).filter(Boolean))];
  return <label className="sports-filter">Sport<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Tous</option>{sports.map((sport) => <option value={sport} key={sport}>{sportLabels[sport] || sport}</option>)}</select></label>;
}

export function StatusFilter({ value, onChange }) {
  return <label className="sports-filter">Statut<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Tous</option><option value="live">En direct</option><option value="upcoming">À venir</option><option value="finished">Terminés</option></select></label>;
}

export function CompetitionFilter({ value, onChange, matches = [] }) {
  const competitions = [...new Map(matches.filter((match) => match.competition?.id).map((match) => [String(match.competition.id), match.competition])).values()];
  return <label className="sports-filter">Compétition<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Toutes</option>{competitions.map((competition) => <option value={competition.id} key={competition.id}>{competition.name}</option>)}</select></label>;
}

export function MatchList({ matches = [], updatedAt, stale = false }) {
  if (!matches.length) return <LiveEmptyState />;
  return <div className="sports-match-list">{matches.map((match) => <LiveMatchCard match={match} updatedAt={updatedAt} stale={stale} key={match.id} />)}</div>;
}

function useFilters() {
  const [sport, setSport] = useState("");
  const [status, setStatus] = useState("");
  const [competition, setCompetition] = useState("");
  const params = useMemo(() => ({ sport, status, competition }), [sport, status, competition]);
  return { sport, setSport, status, setStatus, competition, setCompetition, params };
}

function SportsPageShell({ kicker, title, description, children }) {
  return <div className="sports-live-page site-container"><div className="sports-live-breadcrumb"><Link to="/sport">Sport</Link><span>/</span><span>{title}</span></div><header className="sports-live-heading"><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{description}</p></header>{children}</div>;
}

function MatchFilters({ filters, matches }) {
  return <div className="sports-filters"><SportFilter value={filters.sport} onChange={filters.setSport} matches={matches} /><StatusFilter value={filters.status} onChange={filters.setStatus} /><CompetitionFilter value={filters.competition} onChange={filters.setCompetition} matches={matches} /></div>;
}

function SportsMatchPage({ type }) {
  const config = {
    live: { title: "En direct", kicker: "GETSTARVIS · SPORT LIVE", description: "Les matchs en cours et leur évolution, à partir des seules données disponibles.", path: "live", section: "MATCHS EN DIRECT" },
    results: { title: "Résultats", kicker: "GETSTARVIS · SPORT", description: "Les rencontres terminées signalées par la source sportive.", path: "results", section: "MATCHS TERMINÉS" },
    schedule: { title: "Calendrier", kicker: "GETSTARVIS · SPORT", description: "Les prochaines rencontres dont l’horaire est fourni par la source.", path: "schedule", section: "À VENIR" },
  }[type];
  const filters = useFilters();
  const { payload, error, loading, refresh } = useSportsResource(config.path, { poll: type === "live", params: filters.params });
  const matches = payload?.data || [];
  const title = type === "live" ? <>Sport <span>En direct</span></> : config.title;
  return <SportsPageShell kicker={config.kicker} title={title} description={config.description}>
    <nav className="sports-section-nav" aria-label="Navigation sport">{[["/sport/live", "En direct"], ["/sport", "Football · Basketball · Rugby"], ["/sport/results", "Résultats"], ["/sport/schedule", "Calendrier"], ["/sport/standings", "Classements"], ["/sport/newgen", "NEWGEN"]].map(([href, label]) => <Link to={href} key={href}>{label}</Link>)}</nav>
    {type === "live" && <div className="sports-live-banner"><LiveIndicator /><span>Scores issus de la source sélectionnée, sous réserve de disponibilité.</span><button type="button" onClick={refresh} aria-label="Actualiser les matchs"><RefreshCw size={15} /></button></div>}
    <MatchFilters filters={filters} matches={matches} /><section className="sports-results-section"><div className="sports-results-title"><span className="eyebrow">{config.section}</span><LastUpdated value={payload?.meta?.lastUpdated} stale={payload?.meta?.stale} /></div>{loading && !payload ? <LiveLoadingState /> : error && !payload ? <LiveErrorState message={error.message} onRetry={refresh} /> : payload?.meta?.stale && type === "live" ? <LiveErrorState message="Les données en direct ont dépassé leur seuil de fraîcheur. Le score n’est pas affiché comme un direct." onRetry={refresh} /> : <MatchList matches={matches} updatedAt={payload?.meta?.lastUpdated} stale={payload?.meta?.stale} />}</section>
    <DataSourceBadge provider={payload?.meta?.provider} />
  </SportsPageShell>;
}

export function SportsLivePage() { return <SportsMatchPage type="live" />; }
export function SportsResultsPage() { return <SportsMatchPage type="results" />; }
export function SportsSchedulePage() { return <SportsMatchPage type="schedule" />; }

export function SportsStandingsPage() {
  const filters = useFilters();
  const { payload, loading, error, refresh } = useSportsResource("standings", { params: filters.params });
  return <SportsPageShell kicker="GETSTARVIS · SPORT" title="Classements" description="Les tableaux transmis par la source sportive, lorsqu’ils sont disponibles."><MatchFilters filters={filters} matches={[]} />{loading && !payload ? <LiveLoadingState /> : error && !payload ? <LiveErrorState message={error.message} onRetry={refresh} /> : Array.isArray(payload?.data) && payload.data.length ? <pre className="sports-data-block">{JSON.stringify(payload.data, null, 2)}</pre> : <LiveEmptyState message="Aucun classement disponible pour cette sélection." />}<DataSourceBadge provider={payload?.meta?.provider} /></SportsPageShell>;
}

export function SportsMatchDetailPage() {
  const { matchId } = useParams();
  const { payload, loading, error, refresh } = useSportsResource(`matches/${encodeURIComponent(matchId || "")}`);
  const match = payload?.data;
  if (loading && !payload) return <SportsPageShell kicker="SPORT LIVE" title="Match"><LiveLoadingState /></SportsPageShell>;
  if (error && !payload) return <SportsPageShell kicker="SPORT LIVE" title="Match"><LiveErrorState message={error.message} onRetry={refresh} /></SportsPageShell>;
  if (!match) return <SportsPageShell kicker="SPORT LIVE" title="Match"><LiveEmptyState message="Détails du match indisponibles." /></SportsPageShell>;
  return <SportsPageShell kicker={match.competition?.name || "SPORT LIVE"} title={`${match.homeTeam.name} — ${match.awayTeam.name}`} description="Détails transmis par la source sportive."><article className="sports-detail-score"><CompetitionHeader competition={match.competition} sport={match.sport} /><MatchStatus match={match} /><div className="sports-match-versus"><TeamCard team={match.homeTeam} /><LiveScore match={match} /><TeamCard team={match.awayTeam} /></div><LastUpdated value={payload?.meta?.lastUpdated} stale={payload?.meta?.stale} /></article><div className="sports-detail-grid"><MatchTimeline events={match.events} /><LiveStats statistics={match.statistics} /><Lineups lineups={match.lineups} /><section className="sports-detail-panel"><h2>Informations</h2><p>{match.startTime ? `Début : ${new Date(match.startTime).toLocaleString("fr-FR")}` : "Information non disponible."}</p><DataSourceBadge provider={payload?.meta?.provider} /></section></div></SportsPageShell>;
}

export function SportsLiveTeaser() {
  const { payload, error, loading } = useSportsResource("live", { poll: false });
  const matches = payload?.data?.filter((match) => match.status === "live").slice(0, 2) || [];
  return <section className="sports-teaser site-container"><div className="sports-teaser-head"><div><span className="eyebrow">GETSTARVIS · SPORT LIVE</span><h2>Le sport, en direct.</h2></div><Link to="/sport/live">Voir le live sportif <ArrowRight size={15} /></Link></div>{loading ? <LiveLoadingState /> : error && !payload ? <LiveEmptyState message="Le service live sera disponible dès la configuration de la source sportive." /> : matches.length ? <MatchList matches={matches} updatedAt={payload?.meta?.lastUpdated} stale={payload?.meta?.stale} /> : <LiveEmptyState message="Aucun match en direct disponible actuellement." />}</section>;
}
