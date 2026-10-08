import { ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";

export function SectionHeading({ eyebrow, title, href, linkLabel = "Tout voir", light = false }) {
  return <div className={light ? "section-heading section-heading-light" : "section-heading"}>
    <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
    {href && <Link className="section-link" to={href}>{linkLabel}<ArrowUpRight size={15} /></Link>}
  </div>;
}

export function DemoFlag() {
  return <span className="demo-flag" title="Contenu fictif pour la prévisualisation">EXEMPLE</span>;
}

export function ArticleCard({ article, variant = "standard" }) {
  return <article className={`article-card article-card-${variant}`}>
    <Link className="article-image-wrap" to={`/article/${article.slug}`} aria-label={article.title}>
      <img src={article.image} alt={article.imageAlt} loading="lazy" />
      <span className="image-category">{article.category}</span>
      <span className="image-arrow"><ArrowUpRight size={19} /></span>
    </Link>
    <div className="article-copy">
      <div className="article-meta"><Link to={article.categoryPath}>{article.category}</Link><span>·</span><span>{article.readTime}</span><DemoFlag /></div>
      <h3><Link to={`/article/${article.slug}`}>{article.title}</Link></h3>
      {variant !== "compact" && <p>{article.excerpt}</p>}
      <div className="article-byline"><span><Clock3 size={13} /> {article.time}</span><span className="verified-note"><BadgeCheck size={14} /> Démo éditoriale</span></div>
    </div>
  </article>;
}

export function CompactArticle({ article, index }) {
  return <article className="compact-article">
    <span className="compact-number">{String(index + 1).padStart(2, "0")}</span>
    <div className="compact-copy"><Link className="compact-category" to={article.categoryPath}>{article.category}</Link><h3><Link to={`/article/${article.slug}`}>{article.title}</Link></h3><span>{article.time} <DemoFlag /></span></div>
    <ArrowUpRight className="compact-arrow" size={17} />
  </article>;
}

export function NewsTicker({ articles }) {
  return <section className="news-ticker" aria-label="Dernières informations">
    <div className="ticker-label"><span className="ticker-dot" /> EN CONTINU <ArrowDownRight size={14} /></div>
    <div className="ticker-items">{articles.slice(0, 4).map((article, index) => <Link key={article.slug} to={`/article/${article.slug}`}><span>{article.time}</span>{article.title}<span className="ticker-separator">{index < 3 ? "↗" : <ArrowRight size={13} />}</span></Link>)}</div>
  </section>;
}

export function Breadcrumbs({ items }) {
  return <nav className="breadcrumbs" aria-label="Fil d’Ariane">{items.map((item, index) => <span key={item.label}>{index > 0 && <span className="breadcrumb-separator">/</span>}{item.href && index < items.length - 1 ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav>;
}
