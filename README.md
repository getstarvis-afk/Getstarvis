# GETSTARVIS

Site officiel du média GETSTARVIS — « Le monde en mouvement ».

## Développement

```sh
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Le front-end utilise React et Vite. L’authentification des lecteurs est gérée par Firebase Authentication. Le site est déployé sur Vercel.

## Structure

- `src/data/media.js` contient les rubriques, disciplines et contenus éditoriaux de démonstration.
- `src/components/media/` regroupe l’interface et la navigation du média.
- `src/pages/media/` contient les pages éditoriales, les comptes et les rubriques sportives.
- `public/brand/` contient les éléments officiels de marque GETSTARVIS.

Les contenus éditoriaux d’exemple sont signalés dans l’interface. Le site couvre le sport sous forme éditoriale ; les scores et le module de suivi sportif en direct sont désactivés pour le moment.


## GETSTARVIS Newsroom

La route `/newsroom` est un espace rédactionnel privé. Elle collecte des signaux via GDELT DOC 2.0, rapproche les URL et titres similaires, conserve les exécutions et les actions dans Firestore, puis laisse la rédaction vérifier, écrire, approuver et publier. GDELT sert uniquement à repérer des sujets : ses résultats, titres, dates et images ne constituent pas une vérification journalistique. Aucune recherche ne publie automatiquement un article.

### Mise en service

1. Active Firestore dans le projet Firebase utilisé par l’authentification du site.
2. Dans les variables d’environnement serveur de Vercel, configure `NEWSROOM_ADMIN_EMAILS` (liste d’adresses séparées par des virgules) et un compte de service Firebase Admin via `NEWSROOM_FIREBASE_SERVICE_ACCOUNT` ou les variables séparées `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Ces secrets ne doivent jamais être préfixés par `VITE_`.
3. Conserve les variables `VITE_FIREBASE_*` réservées à Firebase Authentication côté navigateur. `getstarvis@gmail.com` est proposé comme valeur initiale d’exemple pour la liste éditoriale ; vérifie les comptes avant d’ouvrir l’accès.
4. Déploie les variables, puis ouvre `/newsroom` avec un compte autorisé. La clé de fournisseur n’est pas nécessaire pour GDELT DOC 2.0.

### Recherche et limites

- Les rubriques et vagues de requêtes sont déclarées dans `server/newsroom/catalog.js`. Ajoute une rubrique ici sans lier l’interface à un format fournisseur.
- Le contrat fournisseur est dans `server/newsroom/providers/NewsProvider.js`; l’implémentation GDELT dans `GdeltProvider.js` peut être remplacée sans toucher aux composants React.
- Les requêtes sont mises en cache 5 minutes dans Firestore. Chaque compte rédaction a une limite de 12 secondes entre les recherches manuelles. Les appels parallèles sont regroupés par vagues et les réponses partielles restent signalées.
- Langue, pays, période et nombre de résultats sont paramétrables par la console. Les résultats GDELT restent une liste d’articles détectés, pas le texte complet des sources.
- La route serveur `GET /api/newsroom/cron?categoryId=...` accepte aussi `POST`, mais seulement avec `Authorization: Bearer $CRON_SECRET`. Elle traite une seule rubrique et ne publie jamais. Aucun planning Vercel n’est activé par défaut : configure un Cron après avoir renseigné les secrets Firebase et fixé une cadence compatible avec les limites du fournisseur et du plan Vercel. Pour Vercel Hobby, les crons ne peuvent être configurés qu’une fois par jour ; la précision peut varier. Ne planifie pas une requête par visiteur.

### Vérification et publication

- Pour chaque source, un éditeur doit ouvrir la page, confirmer les faits et évaluer son niveau et son indépendance. Les contrôles automatiques ne certifient jamais une affirmation.
- L’article doit être écrit par la rédaction. Le dossier GDELT ne copie pas le corps des articles et aucune génération automatique n’est branchée.
- Les images repérées restent en aperçu privé. Une image n’est publiée que si sa correspondance, ses droits, son crédit et une preuve de licence sont tous documentés; sinon le site présente le visuel GETSTARVIS à préparer.
- L’ordre des actions est explicite : vérifier STARVERIFY, approuver, puis publier. Le serveur revalide les prérequis et écrit le journal d’audit à chaque action.
- Les articles publics sont servis par `/api/articles` et `/api/articles/:slug`; les API éditoriales exigent un Firebase ID token et une adresse autorisée ou un claim administrateur.

### Configuration locale

Copie `.env.example` vers `.env.local` et complète uniquement les valeurs nécessaires. Les secrets Firebase Admin et `CRON_SECRET` restent côté serveur et ne sont jamais livrés au bundle client. La variable historique `SPORTS_MOCK_MODE` n’est pas utilisée : le module de scores sportifs en direct est désactivé.

### Contrôles

```sh
npm test
npm run lint
npm run build
```
