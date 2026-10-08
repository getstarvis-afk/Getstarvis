import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteLayout } from "./components/media/SiteLayout.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AccountPage, AuthPage } from "./pages/media/AuthPages.jsx";
import { HomePage, CategoryPage, ArticlePage, SearchPage, InfoPage, NotFoundPage } from "./pages/media/PortalPages.jsx";

const pageTitles = {
  "/": "GETSTARVIS — Le monde en mouvement",
  "/actualites": "Actualités — GETSTARVIS",
  "/music": "Music — GETSTARVIS",
  "/sport": "Sport — GETSTARVIS",
  "/sport/football": "Football — GETSTARVIS Sport",
  "/sport/basketball": "Basketball — GETSTARVIS Sport",
  "/sport/rugby": "Rugby — GETSTARVIS Sport",
  "/music/next": "GETSTARVIS NEXT — Les talents à suivre",
  "/sport/newgen": "GETSTARVIS NEWGEN — La nouvelle génération",
  "/starverify": "STARVERIFY — GETSTARVIS",
  "/charte-editoriale": "Charte éditoriale — GETSTARVIS",
  "/recherche": "Recherche — GETSTARVIS",
  "/connexion": "Connexion — GETSTARVIS",
  "/inscription": "Créer un compte — GETSTARVIS",
  "/mot-de-passe-oublie": "Réinitialiser le mot de passe — GETSTARVIS",
  "/compte": "Mon compte — GETSTARVIS",
};

function PageMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pageTitles[pathname] || (pathname.startsWith("/article/") ? "Article — GETSTARVIS" : "GETSTARVIS — Le monde en mouvement");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = "https://getstarvis.com" + pathname;
  }, [pathname]);
  return null;
}

function SiteRoutes() {
  return (
    <>
      <PageMeta />
      <SiteLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/actualites" element={<CategoryPage />} />
          <Route path="/music" element={<CategoryPage />} />
          <Route path="/sport" element={<CategoryPage />} />
          <Route path="/sport/football" element={<CategoryPage />} />
          <Route path="/sport/basketball" element={<CategoryPage />} />
          <Route path="/sport/rugby" element={<CategoryPage />} />
          <Route path="/next" element={<Navigate to="/music/next" replace />} />
          <Route path="/newgen" element={<Navigate to="/sport/newgen" replace />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/recherche" element={<SearchPage />} />
          <Route path="/connexion" element={<AuthPage key="login" />} />
          <Route path="/inscription" element={<AuthPage key="signup" />} />
          <Route path="/mot-de-passe-oublie" element={<AuthPage key="reset" />} />
          <Route path="/compte" element={<AccountPage />} />
          <Route path="/starverify" element={<InfoPage title="STARVERIFY" kicker="FIABILITÉ — EXIGENCE — TRANSPARENCE" description="Pas de confirmation, pas de fait. Découvrez le cadre de vérification de GETSTARVIS." />} />
          <Route path="/charte-editoriale" element={<InfoPage title="Charte éditoriale" kicker="NOS PRINCIPES" description="Les principes qui guident la couverture éditoriale de GETSTARVIS." />} />
          <Route path="/a-propos" element={<InfoPage title="À propos de GETSTARVIS" />} />
          <Route path="/contact" element={<InfoPage title="Contacter la rédaction" description="Les coordonnées de la rédaction seront indiquées ici." />} />
          <Route path="/confidentialite" element={<InfoPage title="Confidentialité" description="Les informations relatives à la confidentialité seront publiées avant l’ouverture du service." />} />
          <Route path="/:section" element={<CategoryPage />} />
          <Route path="/:section/:subsection" element={<CategoryPage />} />
          <Route path="/:section/:subsection/:topic" element={<CategoryPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SiteLayout>
    </>
  );
}

export default function App() {
  return <AuthProvider><BrowserRouter><SiteRoutes /></BrowserRouter></AuthProvider>;
}
