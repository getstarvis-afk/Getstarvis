import { useEffect, useState } from "react"; import { ArrowRight, BadgeCheck, ExternalLink, Globe2, MoveUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { articlesForCategory, categoryData, demoArticles, getArticle, sportsLeagues } from "../../data/media.js";
import { ArticleCard, Breadcrumbs, CompactArticle, DemoFlag, NewsTicker, SectionHeading } from "../../components/media/ContentBlocks.jsx";


function usePublishedArticles() {
  const [published, setPublished] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/articles', { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : { articles: [] })
      .then((result) => { if (!cancelled) setPublished(Array.isArray(result.articles) ? result.articles : []); })
      .catch(() => { if (!cancelled) setPublished([]); });
    return () => { cancelled = true; };
  }, []);
  return published.map((article) => {
    const [section, subsection] = String(article.categoryId || '').split('.');
    const publishedDate = article.publishedAt ? new Date(article.publishedAt) : null;
    return {
      ...article,
      categoryPath: section ? `/${section}${subsection ? `/${subsection}` : ''}` : '/actualites',
      excerpt: article.standfirst || article.whatWeKnow || 'Article rédigé et validé par la rédaction GETSTARVIS.',
      image: article.image?.imageUrl || '/brand/getstarvis-emblem.png',
      imageAlt: article.image?.altText || 'Visuel GETSTARVIS original à préparer',
      readTime: article.readTime || 'À lire',
      time: publishedDate && !Number.isNaN(publishedDate.getTime()) ? new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(publishedDate) : '',
      date: publishedDate && !Number.isNaN(publishedDate.getTime()) ? publishedDate.toLocaleDateString('fr-FR') : '',
      isDemo: false,
    };
  });
}

function getPublishedForCategory(published, key) {
  if (key === 'actualites' || key === '') return published;
  if (key === 'sport' || key === 'music') return published.filter((article) => article.categoryId?.startsWith(`${key}.`));
  const [section, subsection] = key.split('/');
  const categoryId = `${section}.${subsection || ''}`;
  return published.filter((article) => article.categoryId === categoryId);
}

export function HomePage() {
  const published = usePublishedArticles();
  const latestArticles = [...published, ...demoArticles];
  const lead = latestArticles[0];
  const byTime = [...latestArticles].sort((a, b) => (b.publishedAt || b.time || "").localeCompare(a.publishedAt || a.time || ""));
  return <div className="home-page">
    <section className="home-masthead site-container">
      <div className="masthead-copy">
        <span className="eyebrow">LE MÉDIA QUI REGARDE PLUS LOIN</span>
        <h1>Le monde<br /><span>en mouvement.</span></h1>
        <p>Des histoires qui comptent. Des talents à découvrir. Une information pensée pour tous.</p>
        <div className="masthead-actions"><Link className="button button-dark" to="/actualites">Explorer les actualités <ArrowRight size={16} /></Link><span className="masthead-signature">FIABILITÉ<br />EXCELLENCE<br />ACCESSIBILITÉ</span></div>
      </div>
      <div className="masthead-brand" aria-label="GETSTARVIS, le monde en mouvement">
        <img className="masthead-lockup" src="/brand/getstarvis-full.png" alt="GETSTARVIS — Le monde en mouvement" />
        <div className="orbit-caption"><span>01 / 05</span><span>UN REGARD SUR LE MONDE</span></div>
      </div>
    </section>

    <div className="site-container"><NewsTicker articles={byTime} /></div>

    <section className="site-container home-feature-section">
      <SectionHeading eyebrow="LE FIL GETSTARVIS" title="À la une" href="/actualites" />
      <div className="lead-grid">
        <Link className="lead-story" to={`/article/${lead.slug}`}>
          <img src={lead.image} alt={lead.imageAlt} />
          <span className="lead-overlay" />
          <div className="lead-topline"><span className="live-label"><span /> SÉLECTION DE LA RÉDACTION</span>{lead.isDemo !== false && <DemoFlag />}</div>
          <div className="lead-copy"><span className="lead-category">{lead.category} <span>•</span> {lead.isDemo === false ? "ARTICLE PUBLIÉ" : "EXEMPLE DE DÉMONSTRATION"}</span><h3>{lead.title}</h3><p>{lead.excerpt}</p><span className="lead-cta">Lire l’article <ArrowRight size={16} /></span></div>
        </Link>
        <div className="lead-aside"><div className="aside-heading"><span>À SUIVRE</span><span>01 — 03</span></div>{byTime.slice(1, 4).map((article, index) => <CompactArticle key={article.slug} article={article} index={index} />)}<Link className="aside-more" to="/actualites">Toute l’actualité <ArrowRight size={15} /></Link></div>
      </div>
    </section>

    <section className="site-container stream-section">
      <SectionHeading eyebrow="LE TEMPS FORT" title="Dernières informations" href="/actualites" linkLabel="Voir le fil complet" />
      <div className="timeline-list">{byTime.slice(0, 5).map((article) => <Link className="timeline-row" key={article.slug} to={`/article/${article.slug}`}><span className="timeline-time">{article.time}</span><span className="timeline-marker" /><span className="timeline-category">{article.category}</span><span className="timeline-title">{article.title}</span>{article.isDemo !== false && <DemoFlag />}<ArrowRight className="timeline-arrow" size={16} /></Link>)}</div>
      {published.length === 0 && <p className="demo-disclaimer"><BadgeCheck size={15} /> Les contenus visibles sont des exemples de démonstration, pas des actualités confirmées.</p>}
    </section>

    <EditorialSection id="music" eyebrow="LE SON DU MOMENT" title="Music" intro="Explorer les scènes, les sorties et les voix qui dessinent la suite." path="/music" articles={[...getPublishedForCategory(published, "music"), ...articlesForCategory("music")]} tone="dark" />
    <EditorialSection id="sport" eyebrow="L’ACTUALITÉ SPORTIVE" title="Sport" intro="Suivre les matchs, les trajectoires et les nouveaux visages du sport." path="/sport" articles={[...getPublishedForCategory(published, "sport"), ...articlesForCategory("sport")]} tone="light" />

    <section className="next-section site-container">
      <div className="next-intro"><span className="eyebrow">DONNER DE LA PLACE AUX TALENTS</span><h2>Le mouvement<br />commence <em>quelque part.</em></h2><p>GETSTARVIS NEXT et NEWGEN ouvrent le regard sur les artistes émergents et les jeunes talents sportifs.</p></div>
      <div className="talent-panels"><Link to="/music/next" className="talent-panel talent-next"><span className="talent-index">01 — MUSIC & CULTURE</span><span className="talent-title">GETSTARVIS<br /><b>NEXT</b></span><span className="talent-link">Découvrir les talents <ArrowRight size={15} /></span></Link><Link to="/sport/newgen" className="talent-panel talent-newgen"><span className="talent-index">02 — SPORT & NOUVELLE GÉNÉRATION</span><span className="talent-title">GETSTARVIS<br /><b>NEWGEN</b></span><span className="talent-link">Rencontrer la newgen <ArrowRight size={15} /></span></Link></div>
    </section>

    <section className="verify-section">
      <div className="site-container verify-inner"><div className="verify-symbol"><ShieldCheck size={26} /></div><div className="verify-copy"><span className="eyebrow">NOTRE ENGAGEMENT ÉDITORIAL</span><h2>Pas de confirmation,<br /><em>pas de fait.</em></h2><p>STARVERIFY décrit une méthode : vérifier, croiser les sources et corriger avec transparence.</p><Link to="/starverify" className="button button-light">Comprendre STARVERIFY <ArrowRight size={16} /></Link></div><div className="verify-stamp"><span>G</span><small>FIABILITÉ<br />EXCELLENCE<br />ACCESSIBILITÉ</small></div></div>
    </section>

    <section className="site-container closing-note"><span>GETSTARVIS</span><p>À chacun son étoile.<br />Il faut la viser pour pouvoir l’atteindre.</p><Link to="/a-propos" aria-label="À propos de Getstarvis"><MoveUpRight size={23} /></Link></section>
  </div>;
}

function EditorialSection({ id, eyebrow, title, intro, path, articles, tone }) {
  return <section className={`editorial-band editorial-${tone}`} id={id}><div className="site-container"><SectionHeading eyebrow={eyebrow} title={title} href={path} linkLabel={`Tout voir ${title}`} light={tone === "dark"} /><p className="editorial-intro">{intro}</p><div className="article-grid">{articles.slice(0, 3).map((article) => <ArticleCard key={article.slug} article={article} />)}</div></div></section>;
}

export function CategoryPage() {
  const published = usePublishedArticles();
  const { pathname } = useLocation();
  const categoryKey = (pathname || "").replace(/^\/+/, "") || "actualites";
  const routeParts = categoryKey.split("/");
  const parentKey = routeParts.slice(0, -1).join("/");
  const parentCategory = categoryData[parentKey] || categoryData[routeParts[0]];
  const displayName = (value) => value === "r-b" ? "R&B" : value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const routeTitle = displayName(routeParts.at(-1) || "actualites");
  const content = categoryData[categoryKey] || (parentCategory
    ? { ...parentCategory, title: routeParts.length > 1 ? routeTitle : parentCategory.title }
    : { title: routeTitle, kicker: "LE MONDE EN MOUVEMENT", description: "Explorez cette rubrique GETSTARVIS.", subcategories: [] });
  const articles = [...getPublishedForCategory(published, categoryKey), ...articlesForCategory(categoryKey)];
  const hero = articles[0] || demoArticles[0];
  const sectionRoot = "/" + (categoryData[categoryKey] ? categoryKey : categoryData[parentKey] ? parentKey : routeParts[0]);
  const slugify = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const linkFor = (item) => sectionRoot + "/" + slugify(item);
  const breadcrumbs = [{ label: "Accueil", href: "/" }].concat(routeParts.map((part, index) => {
    const path = routeParts.slice(0, index + 1).join("/");
    const label = categoryData[path]?.title || displayName(part);
    return index < routeParts.length - 1 ? { label, href: "/" + path } : { label };
  }));
  if (categoryKey === "sport") return <SportHubPage breadcrumbs={breadcrumbs} content={content} articles={articles} linkFor={linkFor} />;
  return <div className={`category-page site-container theme-${routeParts[0]}`}>
    <Breadcrumbs items={breadcrumbs} />
    <header className="category-heading"><span className="eyebrow">{content.kicker}</span><h1>{content.title}</h1><p>{content.description}</p></header>
    <nav className="category-nav" aria-label={`Navigation ${content.title}`}>{content.subcategories.map((item) => <Link to={linkFor(item)} key={item}>{item}<MoveUpRight size={13} /></Link>)}</nav>
    <div className="category-feature">
      <Link className="category-feature-image" to={`/article/${hero.slug}`}><img src={hero.image} alt={hero.imageAlt} /><span className="image-arrow"><ArrowRight size={18} /></span></Link>
      <div className="category-feature-copy"><span className="eyebrow">LE GRAND FORMAT {hero.isDemo !== false && <DemoFlag />}</span><h2><Link to={`/article/${hero.slug}`}>{hero.title}</Link></h2><p>{hero.excerpt}</p><div className="feature-meta">{hero.category} <span>·</span> {hero.readTime} de lecture</div><Link className="button button-dark" to={`/article/${hero.slug}`}>Découvrir l’histoire <ArrowRight size={16} /></Link></div>
    </div>
    <section className="category-content"><SectionHeading eyebrow={`LE FIL ${content.title.toUpperCase()}`} title="Dernières informations" /><p className="demo-disclaimer"><BadgeCheck size={15} /> Exemples éditoriaux fictifs pour la démonstration de l’interface.</p><div className="article-grid">{(articles.length ? articles : demoArticles).map((article) => <ArticleCard key={article.slug} article={article} />)}</div></section>
    <section className="category-subsections"><h2>Explorer {content.title}</h2><div>{content.subcategories.map((item, index) => <Link key={item} to={linkFor(item)}><span>0{index + 1}</span>{item}<MoveUpRight size={16} /></Link>)}</div></section>
  </div>;
}

function SportHubPage({ breadcrumbs, content, articles, linkFor }) {
  const hero = articles[0] || demoArticles[0];
  const sidebarArticles = articles.filter((article) => article.slug !== hero.slug);
  return <div className="sport-hub site-container">
    <Breadcrumbs items={breadcrumbs} />
    <header className="sport-hub-heading"><div><span className="eyebrow">{content.kicker}</span><h1>Sport</h1><p>{content.description}</p></div><Link to="/starverify" className="sport-verify-link"><ShieldCheck size={17} /> Notre méthode éditoriale</Link></header>
    <nav className="sport-hub-nav" aria-label="Rubriques sportives">{content.subcategories.map((item) => <Link to={linkFor(item)} key={item}>{item}<MoveUpRight size={13} /></Link>)}</nav>
    <div className="sport-hub-grid">
      <aside className="sport-left-rail">
        <section className="sport-rail-card sport-leagues-card"><span className="sport-rail-title">LES LIGUES</span>{sportsLeagues.map((group) => <div className="sport-league-group" key={group.discipline}><Link className="sport-league-discipline" to={group.path}>{group.discipline}<MoveUpRight size={12} /></Link>{group.leagues.map((league) => <Link className="sport-league-link" to={`${group.path}/${league.slug}`} key={league.slug}>{league.name}<MoveUpRight size={11} /></Link>)}</div>)}</section>
        <section className="sport-rail-card sport-newgen-card"><span className="sport-rail-title">NOUVELLE GÉNÉRATION</span><h2>Les talents<br />de demain.</h2><p>Des parcours, des ambitions et des voix à découvrir.</p><Link to="/sport/newgen">Explorer NEWGEN <ArrowRight size={14} /></Link></section>
      </aside>
      <main className="sport-main-feed">
        <Link className="sport-lead-story" to={`/article/${hero.slug}`}><img src={hero.image} alt={hero.imageAlt} /><span className="sport-lead-overlay" /><span className="sport-lead-label">À LA UNE {hero.isDemo !== false && <DemoFlag />}</span><div className="sport-lead-copy"><span>{hero.category} <span aria-hidden="true">·</span> {hero.readTime} de lecture</span><h2>{hero.title}</h2><p>{hero.excerpt}</p><span className="sport-lead-cta">Lire l’article <ArrowRight size={15} /></span></div></Link>
        <section className="sport-league-block"><div className="sport-section-heading"><span className="sport-ball-mark">S</span><div><span className="eyebrow">LE FIL SPORTIF</span><h2>À suivre</h2></div><Link to="/sport/football">Tout le sport <ArrowRight size={14} /></Link></div><div className="sport-article-feed">{sidebarArticles.length ? sidebarArticles.map((article) => <ArticleCard key={article.slug} article={article} />) : <p className="demo-disclaimer"><BadgeCheck size={15} /> De nouveaux articles sportifs seront bientôt publiés.</p>}</div></section>
      </main>
      <aside className="sport-right-rail">
        <section className="sport-rail-card"><span className="sport-rail-title">À LA UNE</span>{articles.slice(0, 4).map((article, index) => <Link to={`/article/${article.slug}`} className="sport-headline" key={article.slug}><span>0{index + 1}</span><strong>{article.title}</strong><small>{article.category} · Exemple de démonstration</small></Link>)}</section>
        <section className="sport-rail-card sport-editorial-card"><span className="sport-rail-title">FIABILITÉ & TRANSPARENCE</span><h2>Chaque histoire<br />mérite d’être vérifiée.</h2><p>Les contenus de démonstration sont signalés. Notre rédaction contextualise et attribue ses sources.</p><Link to="/starverify">Découvrir STARVERIFY <ArrowRight size={14} /></Link></section>
      </aside>
    </div>
  </div>;
}

export function ArticlePage() {
  const { slug } = useParams();
  const demoArticle = getArticle(slug);
  const [publishedRecord, setPublishedRecord] = useState(null);
  useEffect(() => {
    if (demoArticle) return undefined;
    let cancelled = false;
    fetch(`/api/articles/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : { article: null })
      .then((result) => { if (!cancelled) setPublishedRecord({ slug, article: result.article || null }); })
      .catch(() => { if (!cancelled) setPublishedRecord({ slug, article: null }); });
    return () => { cancelled = true; };
  }, [slug, demoArticle]);
  const publishedArticle = publishedRecord?.slug === slug ? publishedRecord.article : null;
  const article = demoArticle || publishedArticle;
  useEffect(() => {
    if (!article) return;
    const published = article.isDemo === false || Boolean(article.publishedAt);
    document.title = `${article.title} — GETSTARVIS`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = article.standfirst || article.excerpt || '';
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://getstarvis.com/article/${slug}`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = article.title;
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.content = article.image?.imageUrl || article.image || '/brand/getstarvis-full.png';
    if (!published) return;
  }, [article, slug]);
  if (!article && !demoArticle && publishedRecord?.slug !== slug) return <div className="account-loading">Chargement de l’article…</div>;
  if (!article) return <InfoPage title="Article introuvable" kicker="Le fil GETSTARVIS" description="Cet article n’est pas disponible." />;
  const isPublished = article.isDemo === false || Boolean(article.publishedAt);
  const jsonLd = isPublished ? { '@context': 'https://schema.org', '@type': 'NewsArticle', headline: article.title, description: article.standfirst || article.excerpt, datePublished: article.publishedAt, image: article.image?.imageUrl ? [article.image.imageUrl] : undefined, author: { '@type': 'Organization', name: 'Rédaction GETSTARVIS' }, publisher: { '@type': 'Organization', name: 'GETSTARVIS', logo: { '@type': 'ImageObject', url: 'https://getstarvis.com/brand/getstarvis-emblem.png' } }, mainEntityOfPage: `https://getstarvis.com/article/${slug}` } : null;
  const paragraphs = isPublished ? String(article.articleBody || '').split(/\n{2,}/).map((text) => text.trim()).filter(Boolean) : [];
  const visualUrl = article.image?.imageUrl || (typeof article.image === 'string' ? article.image : '');
  return <article className="article-page site-container">{jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}<Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: article.category, href: article.categoryPath || `/${article.categoryId?.replace('.', '/') || 'actualites'}` }, { label: "Article" }]} /><div className="article-header"><span className="eyebrow">{article.category}{isPublished ? ' · STARVERIFY — VÉRIFIÉ' : <> <DemoFlag /></>}</span><h1>{article.title}</h1><p>{article.standfirst || article.excerpt}</p><div className="article-header-meta"><span>Rédaction GETSTARVIS</span><span>{isPublished ? (article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('fr-FR') : 'Publié') : 'Exemple de démonstration'}</span>{article.readTime && <span>{article.readTime} de lecture</span>}</div></div>{visualUrl ? <figure className="article-cover"><img src={visualUrl} alt={article.image?.altText || article.imageAlt || ''} /><figcaption>{article.image?.caption || article.image?.credit || article.imageAlt || ''}{article.image?.credit ? ` · Crédit : ${article.image.credit}` : ''}</figcaption></figure> : <figure className="article-original-visual"><img src="/brand/getstarvis-emblem.png" alt="Emblème GETSTARVIS, visuel original à préparer" /><figcaption>{article.visualPlan || 'Visuel original GETSTARVIS à préparer.'}</figcaption></figure>}<div className="article-body">{!isPublished && <aside className="article-aside-note"><BadgeCheck size={17} /><p>Contenu fictif créé pour prévisualiser le site. Il ne s’agit pas d’une information confirmée.</p></aside>}<div>{isPublished ? <>{article.context && <><h2>Contexte</h2><p>{article.context}</p></>}{paragraphs.map((paragraph, index) => <p className={index === 0 ? 'article-dropcap' : ''} key={`${index}-${paragraph.slice(0,20)}`}>{paragraph}</p>)}{article.whyItMatters && <><h2>Pourquoi c’est important</h2><p>{article.whyItMatters}</p></>}{article.whatWeKnow && <><h2>Ce qu’on sait</h2><p>{article.whatWeKnow}</p></>}{article.whatToConfirm && <><h2>Ce qui reste à confirmer</h2><p>{article.whatToConfirm}</p></>}{article.sources?.length > 0 && <section className="article-sources"><h2>Sources</h2><ol>{article.sources.map((source, index) => <li key={`${source.url}-${index}`}><a href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title || source.domain}</strong><span>{source.domain}</span><ExternalLink size={14} /></a></li>)}</ol></section>}</> : <><p className="article-dropcap">{article.excerpt} Cet espace éditorial présente la structure des articles GETSTARVIS et la manière dont nos contenus pourront être consultés.</p><h2>Comprendre le sujet</h2><p>Un article publié par GETSTARVIS s’appuiera sur des informations vérifiées, des sources croisées et un contexte accessible. Les éléments de démonstration permettent ici de parcourir la mise en page, sans présenter de faits inventés comme des actualités réelles.</p><h2>Notre méthode</h2><p>Chaque publication indiquera ses sources, sa date et son statut de vérification. Lorsqu’une information évolue, les corrections seront clairement signalées.</p></>}<Link to="/starverify" className="article-verify-link"><ShieldCheck size={17} /> Lire notre méthode STARVERIFY <ArrowRight size={15} /></Link></div></div><section className="more-stories"><SectionHeading eyebrow="POUR ALLER PLUS LOIN" title="À lire aussi" href={article.categoryPath || '/actualites'} /><div className="article-grid">{demoArticles.filter((item) => item.slug !== article.slug).slice(0, 3).map((item) => <ArticleCard key={item.slug} article={item} />)}</div></section></article>;
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const [draft, setDraft] = useState(query);
  const results = query.trim() ? demoArticles.filter((article) => `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query.trim().toLowerCase())) : [];
  function submit(event) { event.preventDefault(); setParams(draft.trim() ? { q: draft.trim() } : {}); }
  return <div className="search-page site-container"><Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Recherche" }]} /><header className="search-header"><span className="eyebrow">RECHERCHE GETSTARVIS</span><h1>Explorer<br /><em>les histoires.</em></h1><p>Rechercher parmi les articles et les rubriques GETSTARVIS.</p></header><form className="search-form" onSubmit={submit}><input aria-label="Votre recherche" placeholder="Un sujet, un talent, une discipline…" value={draft} onChange={(event) => setDraft(event.target.value)} /><button type="submit"><span>Rechercher</span><ArrowRight size={17} /></button></form>{query ? <section className="search-results"><SectionHeading eyebrow="RÉSULTATS" title={results.length ? `${results.length} résultat${results.length > 1 ? "s" : ""} pour « ${query} »` : `Aucun résultat pour « ${query} »`} />{results.length > 0 && <div className="article-grid">{results.map((article) => <ArticleCard key={article.slug} article={article} />)}</div>}</section> : <div className="search-hints"><span>À EXPLORER</span>{["Music", "Football", "Basketball", "Newgen"].map((item) => <Link key={item} to={item === "Music" ? "/music" : item === "Newgen" ? "/sport/newgen" : `/sport/${item.toLowerCase()}`}>{item}<ArrowRight size={14} /></Link>)}</div>}</div>;
}

export function InfoPage({ title, kicker, description }) {
  const verify = title.toLowerCase().includes("starverify");
  const charter = title.toLowerCase().includes("charte");
  return <article className="info-page site-container"><Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: title }]} /><header className="info-heading"><span className="eyebrow">{kicker || "GETSTARVIS — NOS ENGAGEMENTS"}</span><h1>{title}</h1><p>{description || "Fiabilité. Excellence. Accessibilité."}</p></header>{verify ? <div className="info-content"><div className="info-lead"><ShieldCheck size={24} /><h2>Pas de confirmation,<br /><em>pas de fait.</em></h2><p>STARVERIFY incarne la méthode que GETSTARVIS souhaite appliquer à l’information : prendre le temps de vérifier et expliquer ce qui est établi.</p></div><div className="principle-list">{[["01", "Vérifier", "Retrouver l’origine des informations avant publication."], ["02", "Croiser", "Comparer les sources et chercher une confirmation indépendante."], ["03", "Contextualiser", "Présenter les éléments disponibles sans amplifier les rumeurs."], ["04", "Corriger", "Signaler les corrections de manière claire et accessible."]].map(([number, name, text]) => <div key={number}><span>{number}</span><div><h3>{name}</h3><p>{text}</p></div></div>)}</div><p className="demo-disclaimer"><BadgeCheck size={15} /> Cette page présente le cadre éditorial du projet. Les processus opérationnels seront précisés à mesure du lancement de la rédaction.</p></div> : charter ? <div className="info-content charter-content"><blockquote>« GETSTARVIS ne cherche pas à être le premier à parler. GETSTARVIS cherche à être celui auquel on peut faire confiance. »</blockquote><div className="principle-list">{[["01", "Fiabilité", "Privilégier les informations vérifiables et attribuer les sources."], ["02", "Excellence", "Apporter rigueur, contexte et soin à chaque publication."], ["03", "Accessibilité", "Rendre l’information compréhensible et facile à consulter."], ["04", "Transparence", "Expliquer les corrections, les limites et les éventuels partenariats."], ["05", "Indépendance", "Protéger les choix éditoriaux des intérêts commerciaux."]].map(([number, name, text]) => <div key={number}><span>{number}</span><div><h3>{name}</h3><p>{text}</p></div></div>)}</div></div> : <div className="info-content"><div className="info-lead"><Globe2 size={24} /><h2>À chacun son étoile.<br /><em>Il faut la viser.</em></h2><p>{description || "GETSTARVIS est un média tourné vers le monde, les talents et les nouvelles générations."}</p><Link className="button button-dark" to="/actualites">Explorer le média <ArrowRight size={16} /></Link></div><div className="info-secondary"><Sparkles size={20} /><h3>Fiabilité. Excellence. Accessibilité.</h3><p>Le monde en mouvement.</p></div></div>}</article>;
}

export function NotFoundPage() {
  return <InfoPage title="Cette page reste à découvrir" kicker="404 — HORS DU FIL" description="La page que vous cherchez n’est pas disponible. Reprenons le fil GETSTARVIS." />;
}




