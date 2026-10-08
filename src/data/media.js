export const primaryNavigation = [
  { label: "Actualités", href: "/actualites" },
  { label: "Music", href: "/music" },
  { label: "Sport", href: "/sport" },
];

export const categoryData = {
  actualites: {
    title: "L’actualité",
    kicker: "Le monde en mouvement",
    description: "Les sujets qui font l’actualité, racontés avec fiabilité, clarté et perspective.",
    subcategories: ["À la une", "France", "Monde", "Culture", "Tech"],
  },
  music: {
    title: "Music",
    kicker: "Les sons d’aujourd’hui, les talents de demain",
    description: "Sorties, scènes, interviews et nouveaux mouvements musicaux.",
    subcategories: ["Rap", "R&B", "Afro", "Pop", "Interviews", "NEXT"],
  },
  sport: {
    title: "Sport",
    kicker: "La passion en mouvement",
    description: "Les grandes histoires du sport, des terrains aux nouveaux talents.",
    subcategories: ["Football", "Basketball", "Rugby", "NEWGEN"],
  },
  "sport/football": {
    title: "Football",
    kicker: "Toute l’actualité du football",
    description: "Les matchs, les clubs et les histoires qui font vivre le football.",
    subcategories: ["Actualités", "Clubs", "Transferts", "Compétitions", "Portraits"],
  },
  "sport/basketball": {
    title: "Basketball",
    kicker: "Le jeu prend de la hauteur",
    description: "L’actualité, les résultats et les talents du basketball.",
    subcategories: ["Actualités", "Clubs", "Compétitions", "Portraits"],
  },
  "sport/rugby": {
    title: "Rugby",
    kicker: "Le jeu, l’engagement, les équipes",
    description: "Les actualités et les histoires du rugby.",
    subcategories: ["Actualités", "Clubs", "Compétitions", "Portraits"],
  },
  "music/next": {
    title: "GETSTARVIS NEXT",
    kicker: "Les talents à suivre",
    description: "Un espace dédié aux artistes émergents et aux nouvelles voix.",
    subcategories: ["Découvertes", "Musique", "Rencontres", "À suivre"],
  },
  "sport/newgen": {
    title: "GETSTARVIS NEWGEN",
    kicker: "La prochaine génération du sport",
    description: "À la rencontre des jeunes talents qui façonnent le sport de demain.",
    subcategories: ["Portraits", "Football", "Basketball", "Rugby"],
  },
};

export const sportsLeagues = [
  { discipline: "Football", path: "/sport/football", leagues: [{ name: "Ligue 1", slug: "ligue-1" }, { name: "Premier League", slug: "premier-league" }, { name: "Liga", slug: "liga" }, { name: "Ligue des champions", slug: "ligue-des-champions" }] },
  { discipline: "Basketball", path: "/sport/basketball", leagues: [{ name: "NBA", slug: "nba" }, { name: "EuroLeague", slug: "euroleague" }, { name: "Betclic Élite", slug: "betclic-elite" }] },
  { discipline: "Rugby", path: "/sport/rugby", leagues: [{ name: "Top 14", slug: "top-14" }, { name: "Pro D2", slug: "pro-d2" }, { name: "Tournoi des Six Nations", slug: "tournoi-des-six-nations" }] },
];

const photos = {
  stage: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1500&q=85",
  football: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1100&q=85",
  studio: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85",
  basketball: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1000&q=85",
  runner: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1000&q=85",
  headphones: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1000&q=85",
  stadium: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=85",
};

export const demoArticles = [
  {
    slug: "les-nouvelles-scenes-musicales-qui-font-bouger-paris",
    title: "Les nouvelles scènes musicales qui font bouger Paris",
    excerpt: "Une génération d’artistes réinvente les lieux, les sons et la manière de se retrouver.",
    category: "Music",
    categoryPath: "/music",
    time: "12:42",
    date: "Démonstration",
    image: photos.stage,
    imageAlt: "Scène de concert illuminée devant un public",
    readTime: "4 min",
    featured: true,
  },
  {
    slug: "football-les-academies-qui-changent-la-donne",
    title: "Au cœur des académies qui changent la donne",
    excerpt: "Comment les nouvelles méthodes d’accompagnement font grandir les talents de demain.",
    category: "Football",
    categoryPath: "/sport/football",
    time: "12:18",
    date: "Démonstration",
    image: photos.football,
    imageAlt: "Terrain de football éclairé par les projecteurs",
    readTime: "6 min",
  },
  {
    slug: "dans-les-coulisses-dune-scene-en-pleine-evolution",
    title: "Dans les coulisses d’une scène en pleine évolution",
    excerpt: "Rencontre avec celles et ceux qui accompagnent les nouveaux artistes.",
    category: "Music",
    categoryPath: "/music",
    time: "11:56",
    date: "Démonstration",
    image: photos.studio,
    imageAlt: "Chanteuse au micro dans un studio de musique",
    readTime: "5 min",
  },
  {
    slug: "basketball-une-generation-qui-redessine-le-jeu",
    title: "Une génération qui redessine le jeu",
    excerpt: "Des playgrounds aux clubs, le basketball attire de nouveaux publics.",
    category: "Basketball",
    categoryPath: "/sport/basketball",
    time: "11:24",
    date: "Démonstration",
    image: photos.basketball,
    imageAlt: "Ballon de basketball dans une salle de sport",
    readTime: "3 min",
  },
  {
    slug: "newgen-les-jeunes-sportifs-et-leurs-nouvelles-ambitions",
    title: "Les jeunes sportifs et leurs nouvelles ambitions",
    excerpt: "Portrait d’une génération qui construit son parcours avec exigence.",
    category: "Newgen",
    categoryPath: "/newgen",
    time: "10:48",
    date: "Démonstration",
    image: photos.runner,
    imageAlt: "Athlète qui court sur une piste",
    readTime: "5 min",
  },
  {
    slug: "musique-comment-se-fabrique-un-son-collectif",
    title: "Comment se fabrique un son collectif",
    excerpt: "Studios partagés, collaborations et indépendance au cœur de la création.",
    category: "Music",
    categoryPath: "/music",
    time: "10:15",
    date: "Démonstration",
    image: photos.headphones,
    imageAlt: "Casque audio posé dans un studio",
    readTime: "4 min",
  },
  {
    slug: "football-les-stades-repensent-lexperience-des-supporters",
    title: "Les stades repensent l’expérience des supporters",
    excerpt: "Nouvelles habitudes, nouvelles attentes : les enceintes se transforment.",
    category: "Football",
    categoryPath: "/sport/football",
    time: "09:52",
    date: "Démonstration",
    image: photos.stadium,
    imageAlt: "Vue d’un stade de football depuis les tribunes",
    readTime: "7 min",
  },
];

export const getArticle = (slug) => demoArticles.find((article) => article.slug === slug);

export function articlesForCategory(key) {
  if (key === "actualites") return demoArticles;
  if (key === "sport/newgen" || key.startsWith("sport/newgen/")) return demoArticles.filter((article) => ["Newgen", "Football", "Basketball", "Rugby"].includes(article.category));
  if (key === "sport") return demoArticles.filter((article) => ["Football", "Basketball", "Rugby"].includes(article.category));
  if (key.startsWith("sport/")) {
    const target = key.split("/")[1];
    if (target === "resultats") return articlesForCategory("sport");
    if (target === "transferts") return articlesForCategory("sport/football");
    return demoArticles.filter((article) => article.category.toLowerCase() === target);
  }
  if (key === "music/next") return demoArticles.filter((article) => article.category === "Music");
  if (key === "sport/newgen") return demoArticles.filter((article) => article.category === "Newgen" || article.category === "Basketball");
  if (key.startsWith("music/")) return demoArticles.filter((article) => article.category === "Music");
  return demoArticles.filter((article) => article.category.toLowerCase() === key);
}
