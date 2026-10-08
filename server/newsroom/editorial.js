import { normalizeTitle } from './gdelt.js';

const categoryWords = {
  Sport: ['football','soccer','basketball','nba','rugby','sport','club','player','joueur','equipe','team','match','league','ligue','coach','transfer','transfert','injury','blessure','competition','federation','athlete','athlete'],
  Music: ['music','musique','artist','artiste','singer','chanteur','rapper','rap','album','single','song','chanson','release','sortie','concert','label','afrobeat','afrobeats','pop','interview','rnb','producer','producteur'],
};
const cautious = /\b(could|may|might|reportedly|rumou?red|possible|possibly|allegedly|said to|could be|serait|pourrait|selon|envisage|rumeur|possible|potentiel)\b/i;
const certain = /\b(officially|official|confirms?|confirmed|announces?|announced|signs?|signed|joins?|joined|wins?|won|injured|suspended|officiel|confirme|confirme|annonce|signe|rejoint|remporte|bless[eé]|suspendu)\b/i;
const highRisk = /\b(death|dead|died|arrest|arrested|accused|accusation|doping|dopage|scandal|scandale|fraud|fraude|lawsuit|court|judicial|sant[eé]|health|injury|injured|blessure|mineur|minor|discrimination|violence|rape|agression|suicide|mort|d[eé]c[eè]s|arr[eê]t[eé])\b/i;

export function checkEditorialConsistency(item) {
  const title = String(item.title || '').trim();
  const body = [item.standfirst, item.articleBody, item.context, item.whyItMatters, item.whatWeKnow].filter(Boolean).join(' ');
  const titleTokens = new Set(normalizeTitle(title));
  const bodyTokens = new Set(normalizeTitle(body));
  const shared = [...titleTokens].filter((word) => bodyTokens.has(word)).length;
  const titleBody = titleTokens.size >= 3 && shared >= Math.min(3, Math.ceil(titleTokens.size * 0.25));
  const category = item.category === 'Sport' ? categoryWords.Sport : categoryWords.Music;
  const bodyCategorySignals = normalizeTitle(body).filter((word) => category.includes(word));
  const categoryMatch = new Set(bodyCategorySignals).size >= 1;
  const sourceTitles = (item.sources || []).map((source) => source.title || '').join(' ');
  const tooCertain = certain.test(title) && cautious.test(sourceTitles);
  const hasSources = (item.sources || []).some((source) => validHttpUrl(source.url));
  const image = item.image || null;
  const imageRights = !image || (image.rightsStatus === 'LICENSE_KNOWN' && image.credit?.trim() && image.rightsEvidenceUrl && validHttpUrl(image.rightsEvidenceUrl));
  const checks = {
    titleBody: { pass: titleBody, label: 'Titre et corps cohérents' },
    categoryMatch: { pass: categoryMatch, label: 'Catégorie compatible avec le contenu' },
    sourcesPresent: { pass: hasSources, label: 'Au moins une source enregistrée' },
    titleCertainty: { pass: !tooCertain, label: tooCertain ? 'TITLE TOO CERTAIN' : 'Titre conforme au niveau de certitude disponible' },
    imageRights: { pass: imageRights, label: imageRights ? 'Droits du visuel documentés ou aucun visuel' : 'Droits/crédit du visuel à vérifier' },
    highRisk: { pass: !highRisk.test(`${title} ${body}`), label: highRisk.test(`${title} ${body}`) ? 'Sujet sensible : validation humaine renforcée' : 'Pas de signal automatique de sujet sensible' },
  };
  const blockers = Object.entries(checks).filter(([key, value]) => !value.pass && key !== 'highRisk').map(([, value]) => value.label);
  return { pass: blockers.length === 0, blockers, highRisk: !checks.highRisk.pass, checks };
}

export function validHttpUrl(value) {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}
