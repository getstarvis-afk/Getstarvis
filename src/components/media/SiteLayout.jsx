import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ArrowUpRight, Menu, Search, UserRound, X } from "lucide-react";
import { primaryNavigation } from "../../data/media.js";
import { useAuth } from "../../context/useAuth.js";

function useLocalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {
    time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: zone }).format(now),
    zone: zone?.replaceAll("_", " ") || "Heure locale",
  };
}

export function BrandMark({ full = false }) {
  return (
    <Link className={full ? "brand-lockup" : "brand-mark"} to="/" aria-label="GETSTARVIS — accueil">
      <img src="/brand/getstarvis-emblem.png" alt="" />
      <span className="brand-wordmark">GETSTARVIS</span>
      {full && <span className="brand-tagline">LE MONDE EN MOUVEMENT</span>}
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { time, zone } = useLocalClock();
  const { user } = useAuth();

  return (
    <>
      <div className="utility-bar">
        <div className="site-container utility-inner">
          <span className="utility-motto">FIABILITÉ. EXCELLENCE. ACCESSIBILITÉ.</span>
          <div className="utility-meta">
            <span title={zone}>{time} <span className="utility-muted">{zone}</span></span>
            <span className="utility-divider" />
            <span className="weather-fallback">MÉTÉO <span>service à connecter</span></span>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="site-container header-main">
          <button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <BrandMark />
          <nav className="primary-nav" aria-label="Navigation principale">
            {primaryNavigation.map((item) => <NavLink key={item.href} to={item.href} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>{item.label}</NavLink>)}
          </nav>
          <div className="header-actions">
            <Link className="search-link" to="/recherche" aria-label="Rechercher"><Search size={18} /><span>Recherche</span></Link>
            <Link className="menu-link" to="/actualites">Explorer <ArrowUpRight size={15} /></Link>
            <Link className="account-link" to={user ? "/compte" : "/connexion"}><UserRound size={15} /><span>{user ? "Mon compte" : "Connexion / Inscription"}</span></Link>
          </div>
        </div>
        {menuOpen && <div className="mobile-nav-wrap"><nav className="site-container mobile-nav" aria-label="Navigation mobile">
          {primaryNavigation.map((item, index) => <NavLink key={item.href} to={item.href} onClick={() => setMenuOpen(false)}><span className="mobile-nav-index">0{index + 1}</span>{item.label}<ArrowUpRight size={16} /></NavLink>)}
          <Link to="/recherche" onClick={() => setMenuOpen(false)}><span className="mobile-nav-index">⌕</span>Recherche<Search size={16} /></Link>
        </nav></div>}
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-main">
          <div className="footer-brand"><BrandMark full /><p>Un regard fiable sur celles et ceux qui font bouger le monde.</p></div>
          <div className="footer-column"><span className="footer-label">LE MÉDIA</span><Link to="/actualites">Actualités</Link><Link to="/music">Music</Link><Link to="/music/next">GETSTARVIS NEXT</Link><Link to="/sport">Sport</Link><Link to="/sport/newgen">GETSTARVIS NEWGEN</Link></div>
          <div className="footer-column"><span className="footer-label">NOS ENGAGEMENTS</span><Link to="/starverify">STARVERIFY</Link><Link to="/charte-editoriale">Charte éditoriale</Link><Link to="/a-propos">À propos</Link><Link to="/contact">Contact</Link></div>
          <div className="footer-note"><span className="footer-label">NOTRE SIGNATURE</span><p>« Pas de confirmation,<br />pas de fait. »</p><Link to="/starverify" className="footer-arrow">Découvrir STARVERIFY <ArrowUpRight size={15} /></Link></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} GETSTARVIS</span><span>LE MONDE EN MOUVEMENT</span><Link to="/confidentialite">Confidentialité</Link></div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }) {
  return <><a className="skip-link" href="#contenu">Aller au contenu</a><SiteHeader /><main id="contenu">{children}</main><SiteFooter /></>;
}


