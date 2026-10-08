import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, Check, Clock3, ExternalLink, FileCheck2, Image as ImageIcon, LoaderCircle, Plus, RefreshCw, Save, Search, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/useAuth.js';
import { categoryCatalog } from '../../../server/newsroom/catalog.js';
import './newsroom.css';

const EMPTY_REVIEW = { sourceClaimsConfirmed: false, primarySourceVerified: false, independentCorroborationVerified: false, titleCertaintyReviewed: false, articleConsistencyReviewed: false, highRiskReviewed: false, imageMatchConfirmed: false, imageRightsReviewed: false };
const EMPTY_DRAFT = { title: '', standfirst: '', articleBody: '', context: '', whyItMatters: '', whatWeKnow: '', whatToConfirm: '', socialCopy: '', sources: [], image: null, visualPlan: 'Visuel original GETSTARVIS à préparer si aucune image ne peut être utilisée.', review: EMPTY_REVIEW };

async function newsroomRequest(path, user, options = {}) {
  const token = await user.getIdToken();
  const response = await fetch(`/api/newsroom/${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(payload?.error?.message || 'Le service éditorial est indisponible.'), { status: response.status, payload });
  return payload;
}

function prettyDate(value) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
function statusName(item) {
  if (item.status === 'PUBLISHED') return 'Publié';
  if (item.status === 'APPROVED') return 'Approuvé';
  if (item.status === 'REJECTED') return 'Rejeté';
  if (item.status === 'WATCH') return 'À surveiller';
  if (item.starverify === 'VERIFIED') return 'Vérifié · à rédiger';
  return 'À vérifier';
}
function sourceLevelLabel(level) {
  return ({ A_PRIMARY_CANDIDATE: 'A · source primaire candidate', B_RECOGNIZED_CANDIDATE: 'B · média reconnu candidat', C_SPECIALIZED_CANDIDATE: 'C · spécialisé', D_SOCIAL_SIGNAL: 'D · signal social', UNASSESSED: 'À évaluer' })[level] || 'À évaluer';
}

export function NewsroomPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [categoryId, setCategoryId] = useState('sport.football');
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [timespan, setTimespan] = useState('24h');
  const [language, setLanguage] = useState('');
  const [sourceCountry, setSourceCountry] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newSource, setNewSource] = useState({ title: '', url: '' });
  const [expandedSources, setExpandedSources] = useState(true);
  const [activeTab, setActiveTab] = useState('new');

  const load = useCallback(async (keepSelection = true) => {
    if (!user) return;
    try {
      const result = await newsroomRequest('items', user);
      setData(result);
      const nextId = keepSelection && selectedId && result.items.some((item) => item.id === selectedId) ? selectedId : '';
      setSelectedId(nextId);
      if (nextId) {
        const selected = result.items.find((item) => item.id === nextId);
        setDraft({ ...EMPTY_DRAFT, ...selected, review: { ...EMPTY_REVIEW, ...selected.review }, sources: selected.sources || [] });
      }
      setError('');
    } catch (loadError) { setError(loadError.message); }
  }, [user, selectedId]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    newsroomRequest('items', user).then((result) => { if (!cancelled) { setData(result); setError(''); } }).catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [user]);

  const filteredItems = useMemo(() => (data?.items || []).filter((item) => {
    if (item.categoryId !== categoryId) return false;
    if (activeTab === 'new' && !['NEW', 'UPDATE'].includes(item.changeType)) return false;
    if (activeTab === 'watch' && item.status !== 'WATCH') return false;
    if (activeTab === 'rejected' && item.status !== 'REJECTED') return false;
    if (activeTab === 'history' && !['APPROVED', 'PUBLISHED'].includes(item.status)) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  }), [data, categoryId, activeTab, statusFilter]);

  const selectedItem = data?.items?.find((item) => item.id === selectedId) || null;
  const consistency = selectedItem?.consistency || null;
  const setField = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const setReview = (key, value) => setDraft((current) => ({ ...current, review: { ...EMPTY_REVIEW, ...current.review, [key]: value } }));

  async function saveDraft({ quiet = false } = {}) {
    if (!selectedId || !user) return null;
    setBusy(true); setError('');
    try {
      const response = await newsroomRequest(`item?id=${encodeURIComponent(selectedId)}`, user, { method: 'PATCH', body: JSON.stringify({ title: draft.title, standfirst: draft.standfirst, articleBody: draft.articleBody, context: draft.context, whyItMatters: draft.whyItMatters, whatWeKnow: draft.whatWeKnow, whatToConfirm: draft.whatToConfirm, socialCopy: draft.socialCopy, sources: draft.sources, image: draft.image ? { ...draft.image, verificationStatus: draft.review?.imageMatchConfirmed ? 'MATCH_CONFIRMED' : 'UNVERIFIED' } : null, visualPlan: draft.visualPlan, review: draft.review }) });
      setData((current) => current ? { ...current, items: current.items.map((item) => item.id === selectedId ? { ...response.item, consistency: response.consistency } : item) } : current);
      setDraft({ ...EMPTY_DRAFT, ...response.item, review: { ...EMPTY_REVIEW, ...response.item.review }, sources: response.item.sources || [] });
      if (!quiet) setNotice('Brouillon enregistré. Rien n’a été publié.');
      return response;
    } catch (saveError) { setError(saveError.message); return null; }
    finally { setBusy(false); }
  }

  async function doAction(action) {
    if (!selectedId || !user) return;
    setError(''); setNotice('');
    if (action !== 'reject' && action !== 'watch') {
      const saved = await saveDraft({ quiet: true });
      if (!saved) return;
    }
    setBusy(true);
    try {
      const result = await newsroomRequest(`item?id=${encodeURIComponent(selectedId)}`, user, { method: 'POST', body: JSON.stringify({ action }) });
      setData((current) => current ? { ...current, items: current.items.map((item) => item.id === selectedId ? { ...result.item, consistency: result.consistency } : item) } : current);
      setDraft({ ...EMPTY_DRAFT, ...result.item, review: { ...EMPTY_REVIEW, ...result.item.review }, sources: result.item.sources || [] });
      setNotice(({ verify: 'STARVERIFY enregistré après ton contrôle humain.', approve: 'Article approuvé par la rédaction.', publish: 'Article publié sur GETSTARVIS.', reject: 'Sujet rejeté.', watch: 'Sujet ajouté à la veille.' })[action]);
      if (action === 'publish') setActiveTab('history');
    } catch (actionError) {
      const blockers = actionError.payload?.error?.blockers;
      setError(blockers?.length ? `${actionError.message} ${blockers.join(' · ')}` : actionError.message);
    } finally { setBusy(false); }
  }

  async function search() {
    if (!user) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await newsroomRequest('search', user, { method: 'POST', body: JSON.stringify({ categoryId, timespan, maxRecords: 75, sort: 'datedesc', language: language || undefined, sourceCountry: sourceCountry || undefined }) });
      setNotice(`${result.counts.newSubjects} nouveau(x) sujet(s), ${result.counts.updates} mise(s) à jour, ${result.counts.duplicates} URL doublon(s). Les résultats restent à vérifier.`);
      await load(false);
    } catch (searchError) { setError(searchError.message); }
    finally { setBusy(false); }
  }

  async function selectItem(item) {
    setSelectedId(item.id);
    setError(''); setNotice('');
    try {
      const result = await newsroomRequest(`item?id=${encodeURIComponent(item.id)}`, user);
      setDraft({ ...EMPTY_DRAFT, ...result.item, review: { ...EMPTY_REVIEW, ...result.item.review }, sources: result.item.sources || [] });
      setData((current) => current ? { ...current, items: current.items.map((entry) => entry.id === item.id ? { ...entry, consistency: result.consistency } : entry) } : current);
    } catch (selectionError) { setError(selectionError.message); }
  }

  async function addSource(event) {
    event.preventDefault();
    try {
      const url = new URL(newSource.url);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Utilise une adresse HTTP ou HTTPS.');
      const source = { id: crypto.randomUUID(), title: newSource.title.trim() || url.hostname, url: url.toString(), domain: url.hostname.replace(/^www\./, ''), level: 'UNASSESSED', verificationStatus: 'UNVERIFIED', independence: 'UNKNOWN', queryUsed: 'Ajout manuel', retrievedAt: new Date().toISOString(), publishedAt: null, socialImage: null, rightsStatus: 'NO_IMAGE' };
      setField('sources', [...draft.sources, source].slice(0, 24)); setNewSource({ title: '', url: '' }); setNotice('Source ajoutée au brouillon. Enregistre pour conserver cette modification.');
    } catch (sourceError) { setError(sourceError.message || 'URL invalide.'); }
  }

  if (authLoading) return <div className="newsroom-loading site-container"><LoaderCircle className="newsroom-spin" /> Vérification de la session rédaction…</div>;
  if (!user) return <div className="newsroom-gate site-container"><span className="eyebrow">ESPACE PRIVÉ — GETSTARVIS</span><h1>Newsroom</h1><p>Connecte-toi avec ton compte de rédaction pour accéder aux sujets et aux sources.</p><Link className="button button-dark" to="/connexion">Se connecter <ArrowRight size={15} /></Link></div>;

  return <div className="newsroom-page site-container">
    <div className="newsroom-topline"><Link to="/sport" className="newsroom-back"><ArrowLeft size={15} /> Retour au média</Link><span className="newsroom-private"><ShieldCheck size={14} /> ESPACE RÉDACTION PRIVÉ</span></div>
    <header className="newsroom-header"><div><span className="eyebrow">GETSTARVIS · RECHERCHE ET PRÉPARATION ÉDITORIALE</span><h1>Newsroom<span>.</span></h1><p>Détecter, croiser, contextualiser. La validation humaine garde le dernier mot.</p></div><div className="newsroom-policy"><strong>« Mieux vaut être en retard que dans l’erreur. »</strong><span>GDELT détecte des signaux ; ce n’est jamais une preuve.</span></div></header>
    {error && <div className="newsroom-flash is-error" role="alert"><AlertCircle size={17} />{error}<button type="button" aria-label="Fermer" onClick={() => setError('')}><X size={15} /></button></div>}
    {notice && <div className="newsroom-flash is-notice" role="status"><Check size={17} />{notice}<button type="button" aria-label="Fermer" onClick={() => setNotice('')}><X size={15} /></button></div>}
    <section className="newsroom-stats" aria-label="Indicateurs de rédaction">{[
      ['Sujets conservés', data?.stats?.candidates ?? '—', <Search size={17} />], ['Nouveaux sujets', data?.stats?.newSubjects ?? '—', <Sparkles size={17} />], ['Mises à jour', data?.stats?.updates ?? '—', <RefreshCw size={17} />], ['À vérifier', data?.stats?.verifying ?? '—', <ShieldAlert size={17} />], ['Vérifiés', data?.stats?.verified ?? '—', <BadgeCheck size={17} />], ['Prêts à relire', data?.stats?.ready ?? '—', <FileCheck2 size={17} />],
    ].map(([label, value, icon]) => <div className="newsroom-stat" key={label}><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>)}</section>
    <div className="newsroom-workspace">
      <section className="newsroom-inbox">
        <div className="newsroom-section-heading"><div><span className="eyebrow">RADAR GDELT DOC 2.0</span><h2>Recherche éditoriale</h2></div><button className="newsroom-icon-button" type="button" onClick={() => load(false)} aria-label="Actualiser la liste"><RefreshCw size={15} /></button></div>
        <div className="newsroom-search-controls"><label>Rubrique<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{Object.entries(categoryCatalog).map(([id, cat]) => <option value={id} key={id}>{cat.category} · {cat.subcategory}</option>)}</select></label><label>Période<select value={timespan} onChange={(event) => setTimespan(event.target.value)}><option value="1h">1 heure</option><option value="6h">6 heures</option><option value="24h">24 heures</option><option value="3d">3 jours</option><option value="1w">1 semaine</option><option value="1m">1 mois</option><option value="3m">3 mois</option></select></label><button className="button button-dark newsroom-search-button" type="button" onClick={search} disabled={busy}><Search size={15} />{busy ? 'Recherche…' : 'Lancer les vagues'}</button></div>
        <div className="newsroom-source-filters"><label>Langue des sources<select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="">Toutes les langues</option><option value="french">Français</option><option value="english">Anglais</option><option value="spanish">Espagnol</option></select></label><label>Pays source<select value={sourceCountry} onChange={(event) => setSourceCountry(event.target.value)}><option value="">Tous les pays</option><option value="fr">France</option><option value="us">États-Unis</option><option value="gb">Royaume-Uni</option></select></label></div>
        <div className="newsroom-wave-note"><Activity size={14} /> Plusieurs formulations sont recherchées en parallèle. Maximum 75 résultats par vague ; le système affiche le nombre réellement trouvé.</div>
        <div className="newsroom-category-pills">{['new','watch','rejected','history'].map((tab) => <button key={tab} type="button" className={activeTab === tab ? 'is-active' : ''} onClick={() => setActiveTab(tab)}>{{new:'Nouveaux / évolutions',watch:'À surveiller',rejected:'Rejetés',history:'Approuvés / publiés'}[tab]}</button>)}</div>
        <div className="newsroom-list-toolbar"><span>{filteredItems.length} sujet(s) affiché(s)</span><label><span className="sr-only">Filtrer par statut</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">Tous les statuts</option><option value="VERIFYING">À vérifier</option><option value="VERIFIED">Vérifiés</option><option value="APPROVED">Approuvés</option><option value="PUBLISHED">Publiés</option><option value="REJECTED">Rejetés</option><option value="WATCH">À surveiller</option></select></label></div>
        <div className="newsroom-candidate-list">{filteredItems.length ? filteredItems.map((item) => <button key={item.id} type="button" className={`newsroom-candidate ${selectedId === item.id ? 'is-selected' : ''}`} onClick={() => selectItem(item)}><span className={`candidate-change is-${String(item.changeType || '').toLowerCase()}`}>{item.changeType === 'UPDATE' ? 'ÉVOLUTION' : item.changeType === 'NEW' ? 'NOUVEAU' : 'VEILLE'}</span><strong>{item.title || item.sourceTitle || 'Sujet sans titre'}</strong><span className="candidate-meta">{item.category} · {item.subcategory} · {prettyDate(item.lastSeenAt)}</span><span className="candidate-footer"><span>{item.sources?.length || 0} source(s) · {item.duplicateCount || 0} doublon(s)</span><span className={item.starverify === 'VERIFIED' ? 'status-verified' : 'status-pending'}>{statusName(item)}</span></span></button>) : <div className="newsroom-empty"><Search size={18} /><p>Aucun sujet dans cette vue. Lance une recherche GDELT ou consulte une autre rubrique.</p></div>}</div>
        <section className="newsroom-execution-history"><div className="newsroom-section-heading"><div><span className="eyebrow">MÉMOIRE DES RECHERCHES</span><h3>Exécutions récentes</h3></div></div>{(data?.executions || []).slice(0, 5).map((execution) => <div className="newsroom-execution" key={execution.id}><span className={execution.status === 'COMPLETED' ? 'execution-dot' : 'execution-dot is-error'} /><div><strong>{execution.subcategory || execution.category}</strong><small>{prettyDate(execution.startedAt)} · {execution.status}</small></div><span>{execution.counts?.newSubjects ?? 0} nouveaux</span></div>)}{!data?.executions?.length && <p className="newsroom-muted">Aucune recherche enregistrée pour l’instant.</p>}</section><div className="newsroom-audit-list"><span className="eyebrow">JOURNAL D’AUDIT · 30 DERNIÈRES ACTIONS</span>{(data?.audit || []).slice(0, 8).map((event) => <div className="newsroom-audit-event" key={event.id}><strong>{event.action}</strong><span>{event.actorEmail || 'Automatisation'} · {prettyDate(event.createdAt)}</span></div>)}</div>
      </section>
      <section className="newsroom-editor">
        {!selectedItem ? <div className="newsroom-editor-empty"><FileCheck2 size={24} /><span className="eyebrow">DOSSIER ÉDITORIAL</span><h2>Choisis un sujet</h2><p>Chaque piste reste non confirmée jusqu’à ce qu’un rédacteur consulte les sources et valide les faits.</p></div> : <>
          <div className="newsroom-editor-head"><div><span className="eyebrow">{selectedItem.category} · {selectedItem.subcategory}</span><h2>{selectedItem.sourceTitle || 'Sujet sans titre'}</h2><p><span className={selectedItem.starverify === 'VERIFIED' ? 'status-verified' : 'status-pending'}>{selectedItem.starverify === 'VERIFIED' ? 'STARVERIFY · VÉRIFIÉ PAR LA RÉDACTION' : 'STARVERIFY · EN COURS DE VÉRIFICATION'}</span><span> · {selectedItem.sources?.length || 0} source(s)</span></p></div><button type="button" className="newsroom-close-editor" onClick={() => setSelectedId('')} aria-label="Fermer le dossier"><X size={17} /></button></div>
          <div className="newsroom-candidate-warning"><ShieldAlert size={17} /><span>Signal GDELT seulement. Son résultat ne confirme aucune affirmation. Les titres et métadonnées sont des indices, pas le texte vérifié des articles.</span></div>
          <div className="newsroom-source-section"><button type="button" className="newsroom-subheading" onClick={() => setExpandedSources((value) => !value)}><span><ExternalLink size={15} /> Sources à contrôler ({draft.sources?.length || 0})</span><span>{expandedSources ? '−' : '+'}</span></button>{expandedSources && <div className="newsroom-sources">{(draft.sources || []).map((source, index) => <article className="newsroom-source" key={source.id || source.url}><div className="source-index">{String(index + 1).padStart(2, '0')}</div><div className="source-main"><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.title}</strong><ExternalLink size={13} /></a><span>{source.domain} · {source.language || 'langue inconnue'} · {prettyDate(source.publishedAt)}</span><small>{sourceLevelLabel(source.level)} · indépendance : {source.independence === 'CONFIRMED_INDEPENDENT' ? 'contrôlée par la rédaction' : 'non établie'}</small>{source.queryUsed && <small>Requête : {source.queryUsed}</small>}
                <div className="newsroom-source-review">
                  <label><span>Niveau de source</span><select value={source.level || 'UNASSESSED'} onChange={(event) => setField('sources', draft.sources.map((entry) => entry.url === source.url ? { ...entry, level: event.target.value } : entry))}><option value="UNASSESSED">À évaluer</option><option value="A_PRIMARY_CANDIDATE">Source primaire</option><option value="B_RECOGNIZED_CANDIDATE">Média reconnu</option><option value="C_SPECIALIZED_CANDIDATE">Média spécialisé</option><option value="D_SOCIAL_SIGNAL">Signal social</option></select></label>
                  <label className="newsroom-source-check"><input type="checkbox" checked={source.verificationStatus === 'CONFIRMED_BY_EDITOR'} onChange={(event) => setField('sources', draft.sources.map((entry) => entry.url === source.url ? { ...entry, verificationStatus: event.target.checked ? 'CONFIRMED_BY_EDITOR' : 'UNVERIFIED' } : entry))} />Page consultée, faits contrôlés</label>
                  <label className="newsroom-source-check"><input type="checkbox" checked={source.independence === 'CONFIRMED_INDEPENDENT'} onChange={(event) => setField('sources', draft.sources.map((entry) => entry.url === source.url ? { ...entry, independence: event.target.checked ? 'CONFIRMED_INDEPENDENT' : 'UNKNOWN' } : entry))} />Indépendance vérifiée</label>
                </div>
              </div></article>)}
            <form className="newsroom-add-source" onSubmit={addSource}><input aria-label="Nom de la source" placeholder="Nom de la source indépendante" value={newSource.title} onChange={(event) => setNewSource({ ...newSource, title: event.target.value })} /><input aria-label="URL de la source" type="url" required placeholder="https://…" value={newSource.url} onChange={(event) => setNewSource({ ...newSource, url: event.target.value })} /><button type="submit" title="Ajouter une source"><Plus size={15} /> Ajouter</button></form>
          </div>}</div>
          <div className="newsroom-editor-fields"><span className="eyebrow">PROPOSITION GETSTARVIS · RÉDACTION HUMAINE</span><label>Titre proposé<input maxLength={180} value={draft.title || ''} onChange={(event) => setField('title', event.target.value)} placeholder="Titre mesuré, fidèle au niveau de preuve" /></label><label>Chapeau<textarea maxLength={360} rows={2} value={draft.standfirst || ''} onChange={(event) => setField('standfirst', event.target.value)} placeholder="Résumé original et sourcé, après consultation des articles" /></label><label>Article original<textarea maxLength={18000} rows={8} value={draft.articleBody || ''} onChange={(event) => setField('articleBody', event.target.value)} placeholder="Rédige ici un texte GETSTARVIS original après lecture des sources. GDELT ne fournit pas une preuve ni le corps vérifié des articles." /></label><label>Contexte<textarea maxLength={3000} rows={3} value={draft.context || ''} onChange={(event) => setField('context', event.target.value)} placeholder="Éléments de contexte vérifiés et sourcés" /></label><div className="newsroom-two-fields"><label>Pourquoi c’est important<textarea maxLength={2000} rows={3} value={draft.whyItMatters || ''} onChange={(event) => setField('whyItMatters', event.target.value)} /></label><label>Ce qu’on sait<textarea maxLength={2000} rows={3} value={draft.whatWeKnow || ''} onChange={(event) => setField('whatWeKnow', event.target.value)} /></label></div><label>Ce qui reste à confirmer<textarea maxLength={2000} rows={3} value={draft.whatToConfirm || ''} onChange={(event) => setField('whatToConfirm', event.target.value)} /></label>
            <div className="newsroom-image-card"><div className="newsroom-subheading"><span><ImageIcon size={15} /> Visuel principal — aperçu Newsroom uniquement</span><button type="button" onClick={() => { setField('image', null); setReview('imageMatchConfirmed', false); setReview('imageRightsReviewed', false); }}>Retirer ce visuel</button></div>{draft.image?.imageUrl ? <><a className="newsroom-image-preview" href={draft.image.articleUrl || draft.image.imageUrl} target="_blank" rel="noreferrer"><img src={draft.image.imageUrl} alt={draft.image.altText || 'Aperçu de visuel candidat, non validé pour publication'} loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><span>Ouvrir la source <ExternalLink size={13} /></span></a><div className="newsroom-image-meta"><span>Source : {draft.image.sourceDomain || 'inconnue'}</span><strong className="rights-pending">DROITS À VÉRIFIER</strong><small>La présence d’une image dans GDELT ne donne aucun droit de republication.</small></div><div className="newsroom-two-fields"><label>Crédit / photographe<input value={draft.image.credit || ''} onChange={(event) => setField('image', { ...draft.image, credit: event.target.value })} placeholder="À confirmer auprès de la source" /></label><label>URL de preuve de licence<input type="url" value={draft.image.rightsEvidenceUrl || ''} onChange={(event) => setField('image', { ...draft.image, rightsEvidenceUrl: event.target.value })} placeholder="https://… (obligatoire pour les droits connus)" /></label></div><div className="newsroom-two-fields"><label>Alt text<input value={draft.image.altText || ''} onChange={(event) => setField('image', { ...draft.image, altText: event.target.value })} placeholder="Description factuelle du visuel" /></label><label>Statut des droits<select value={draft.image.rightsStatus || 'CHECK_REQUIRED'} onChange={(event) => setField('image', { ...draft.image, rightsStatus: event.target.value })}><option value="CHECK_REQUIRED">À vérifier</option><option value="LICENSE_KNOWN">Licence / autorisation documentée</option><option value="DO_NOT_USE">Ne pas utiliser</option></select></label></div><label>Notes de droits<textarea rows={2} value={draft.image.rightsNotes || ''} onChange={(event) => setField('image', { ...draft.image, rightsNotes: event.target.value })} /></label></> : <div className="newsroom-original-visual"><Sparkles size={17} /><div><strong>VISUEL ORIGINAL NÉCESSAIRE</strong><p>{draft.visualPlan || 'Créer une illustration GETSTARVIS originale, sans prétendre montrer une photographie réelle.'}</p><input aria-label="Brief du visuel original GETSTARVIS" value={draft.visualPlan || ''} onChange={(event) => setField('visualPlan', event.target.value)} /></div></div>}</div>
            <section className="newsroom-human-checks"><span className="eyebrow">CONTRÔLES EXIGÉS — ACTION HUMAINE</span>{[
              ['sourceClaimsConfirmed','J’ai ouvert les sources et vérifié qu’elles confirment réellement les affirmations.'],
              ['primarySourceVerified','J’ai contrôlé une source primaire (communiqué, club, artiste, fédération…).'],
              ['independentCorroborationVerified','J’ai confirmé qu’une source indépendante apporte une corroboration réelle.'],
              ['titleCertaintyReviewed','Le titre n’est pas plus affirmatif que les sources.'],
              ['articleConsistencyReviewed','Titre, corps, catégorie, personne, date et événement sont cohérents.'],
              ...(consistency?.highRisk ? [['highRiskReviewed','J’ai effectué la vérification renforcée de ce sujet sensible.']] : []),
              ...(draft.image ? [['imageMatchConfirmed','J’ai vérifié que cette image montre bien le sujet et le bon événement.'],['imageRightsReviewed','J’ai vérifié le crédit et les droits avant toute utilisation.']] : []),
            ].map(([key, label]) => <label className="newsroom-check" key={key}><input type="checkbox" checked={draft.review?.[key] === true} onChange={(event) => setReview(key, event.target.checked)} /><span><Check size={12} /></span>{label}</label>)}</section>
            {consistency && <section className={`newsroom-consistency ${consistency.pass ? 'is-pass' : 'is-blocked'}`}><div><FileCheck2 size={17} /><strong>{consistency.pass ? 'Contrôle automatique préliminaire — aucun blocage détecté' : 'Contrôle de cohérence — revue requise'}</strong></div><p>Ce contrôle mécanique n’atteste pas de la véracité des affirmations. Il ne remplace pas la lecture des sources.</p>{consistency.blockers?.map((blocker) => <span key={blocker}>{blocker}</span>)}{consistency.highRisk && <span>Sujet à haut risque : approbation humaine renforcée requise.</span>}</section>}
            <div className="newsroom-actions"><button className="button button-light" type="button" onClick={() => saveDraft()} disabled={busy}><Save size={15} /> Enregistrer le brouillon</button><button className="button button-light" type="button" onClick={() => doAction('watch')} disabled={busy}><Clock3 size={15} /> Surveiller</button><button className="button button-light" type="button" onClick={() => doAction('reject')} disabled={busy}><X size={15} /> Rejeter</button>{selectedItem.starverify !== 'VERIFIED' && <button className="button button-dark" type="button" onClick={() => doAction('verify')} disabled={busy}><ShieldCheck size={15} /> STARVERIFY vérifié</button>}{selectedItem.starverify === 'VERIFIED' && selectedItem.status !== 'APPROVED' && selectedItem.status !== 'PUBLISHED' && <button className="button button-dark" type="button" onClick={() => doAction('approve')} disabled={busy}><BadgeCheck size={15} /> Approuver</button>}{selectedItem.status === 'APPROVED' && <button className="button button-dark" type="button" onClick={() => doAction('publish')} disabled={busy}><ArrowRight size={15} /> Publier l’article</button>}</div>
          </div>
        </>}
      </section>
    </div>
    <p className="newsroom-footer-note"><ShieldCheck size={14} /> La collecte GDELT ne publie jamais. Une source doit être consultée par un humain. Les visuels GDELT restent à usage interne tant que les droits ne sont pas documentés.</p>
  </div>;
}
