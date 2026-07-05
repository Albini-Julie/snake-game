# Poulpentin

Un jeu de Snake revisité avec un poulpe, développé dans le cadre du cours de développement Front-End/Back-end. Le projet implémente une architecture client/serveur complète avec authentification, persistance des données, fonctionnalités IA et mode multijoueur en temps réel.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Authentification](#authentification)
- [Gestion des flux et états](#gestion-des-flux-et-états)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)

## Fonctionnalités

- **Authentification** : inscription et connexion via Supabase Auth
- **Avatars personnalisables** : choix parmi plusieurs poulpes colorés
- **Jeu Snake solo** : rendu Canvas HTML5, niveaux de difficulté progressifs
- **Mode démo IA** : un poulpe piloté automatiquement par Mistral AI
- **Conseils de jeu personnalisés** : générés par IA après chaque partie
- **Pseudos générés par IA** : suggestions à l'inscription
- **Mode multijoueur** : deux joueurs en temps réel via WebSockets (matchmaking automatique ou room avec code)
- **Leaderboard** : classement global des meilleurs scores
- **Profil joueur** : statistiques personnelles et historique des parties
- **Système d'achievements** : badges débloqués selon les performances
- **Replay du record mondial** : rejouer la meilleure partie jamais réalisée

## Stack technique

### Frontend

| Élément          | Choix                   |
| ---------------- | ----------------------- |
| Framework        | Vue 3 (Composition API) |
| Routage          | Vue Router              |
| State management | Pinia                   |
| Style            | Tailwind CSS            |
| Rendu du jeu     | Canvas HTML5            |
| Requêtes HTTP    | Axios                   |
| Temps réel       | Socket.io-client        |

### Backend

| Élément       | Choix              |
| ------------- | ------------------ |
| Runtime       | Node.js            |
| Framework     | Express            |
| Temps réel    | Socket.io          |
| Validation    | Zod                |
| Logs          | Pino               |
| Rate limiting | express-rate-limit |

### Base de données & IA

| Élément          | Choix                     |
| ---------------- | ------------------------- |
| BDD              | PostgreSQL (via Supabase) |
| Authentification | Supabase Auth             |
| IA               | Mistral AI                |

## Architecture

Le projet suit une architecture en couches, côté backend comme côté logique de jeu temps réel :

```
┌─────────────┐      REST API       ┌─────────────┐      Service Layer    ┌─────────────┐
│   Vue 3     │ ──────────────────► │   Express   │ ────────────────────► │  Supabase   │
│  (client)   │ ◄────────────────── │  (routes)   │ ◄──────────────────── │  (PostgreSQL)│
└─────────────┘                     └─────────────┘                       └─────────────┘
       │                                    │
       │           WebSocket                │
       └───────────────────────────────────►│
                                      ┌──────▼──────┐
                                      │  Socket.io  │
                                      │ (transport) │
                                      └──────┬──────┘
                                             │
                                      ┌──────▼──────┐
                                      │ gameEngine  │
                                      │(logique pure)│
                                      └─────────────┘
```

**Principe clé** : les routes Express ne contiennent aucune logique métier : elles délèguent systématiquement aux fichiers du dossier `services/`. De la même façon, `multiplayer.js` ne gère que le transport Socket.io et délègue toute la logique du jeu à `services/gameEngine.js`, qui est un module pur sans dépendance réseau.

## Authentification

L'authentification est gérée par **Supabase Auth** côté backend et exposée via des routes Express dédiées.

### Routes d'authentification

| Méthode | Route             | Description                                                | Auth requise |
| ------- | ----------------- | ---------------------------------------------------------- | ------------ |
| `POST`  | `/users/register` | Inscription : crée un compte Supabase Auth + entrée en BDD | Non          |
| `POST`  | `/users/login`    | Connexion : vérifie les identifiants et retourne un JWT    | Non          |

#### POST `/users/register`

```json
// Body
{
  "email": "julie@example.com",
  "password": "motdepasse",
  "username": "Julie"
}

// Réponse 201
{
  "user": { "id": "uuid", "email": "julie@example.com" },
  "session": { "access_token": "eyJ...", "expires_at": 1234567890 }
}
```

#### POST `/users/login`

```json
// Body
{
  "email": "julie@example.com",
  "password": "motdepasse"
}

// Réponse 200
{
  "user": { "id": "uuid", "email": "julie@example.com" },
  "session": { "access_token": "eyJ...", "expires_at": 1234567890 }
}
```

### Middleware JWT (`server/middleware/auth.js`)

Toutes les routes sensibles sont protégées par un middleware qui :

1. Extrait le token du header `Authorization: Bearer <token>`
2. Vérifie sa validité via `supabase.auth.getUser(token)`
3. Attache l'utilisateur à `req.user` pour les handlers suivants
4. Retourne une erreur `401` si le token est absent ou invalide

```js
// Exemple d'utilisation sur une route
router.post(
  "/scores",
  authMiddleware,
  asyncHandler(async (req, res) => {
    // req.user est disponible ici
  }),
);
```

**Routes protégées par le middleware :**

- `POST /scores` : sauvegarder un score
- `GET /scores/stats` : statistiques personnelles
- `GET /scores/me` : historique personnel
- `PUT /users/avatar` : changer d'avatar
- `GET /users/me` : profil utilisateur
- `GET /achievements/me` : achievements débloqués

### Stockage et transmission du token côté frontend

Le token JWT est géré automatiquement par le SDK Supabase :

- **Stockage** : le token est stocké dans le `localStorage` du navigateur par le SDK Supabase
- **Transmission** : le client Axios (`client/src/lib/api.js`) dispose d'un intercepteur qui récupère le token de la session active et l'injecte dans le header `Authorization` de chaque requête :

```js
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

Les mots de passe sont hashés automatiquement par Supabase Auth (bcrypt) : ils ne sont jamais stockés en clair ni accessibles depuis l'API.

### Gestion de l'expiration et déconnexion

- **Expiration** : le store Pinia `auth.js` écoute l'événement `TOKEN_REFRESHED` de Supabase et met à jour l'utilisateur automatiquement. Le token est renouvelé de façon transparente avant son expiration.
- **Déconnexion** : le bouton EXIT dans le header appelle `auth.logout()` qui :
  1. Appelle `supabase.auth.signOut()` pour invalider la session côté Supabase
  2. Vide `user` et `profile` dans le store Pinia
  3. Redirige vers `/login` via Vue Router

```js
// store/auth.js
async function logout() {
  await supabase.auth.signOut();
  user.value = null;
  profile.value = null;
}

// Sur l'événement SIGNED_OUT
if (event === "SIGNED_OUT") {
  user.value = null;
  profile.value = null;
}
```

### Évolution de la base de données

Le modèle de données initial (document de cadrage) prévoyait 3 tables : `users`, `avatars` et `scores`. Au fil du développement, deux tables ont été ajoutées pour supporter les nouvelles fonctionnalités :

- `achievements` : liste des badges disponibles (slug, nom, description, couleur)
- `user_achievements` : table de jointure entre `users` et `achievements`, avec la date de déblocage

Le MLD final est donc :

users(id, username, email, registration_date, password, #avatar_id)
avatars(id, name, path)
scores(id, value, duration, registration_date, seed, inputs, #user_id)
achievements(id, slug, name, description, color)
user_achievements(id, unlocked_at, #user_id, #achievement_id)

## Gestion des flux et états

Le projet implémente une gestion complète des états pour chaque flux de données, avec une séparation claire entre la couche API (`client/src/api/`), la logique métier (`server/services/`) et l'affichage.

### Flux 1 - Jeu solo (`useGame.js`)

Le composable `useGame` gère l'intégralité du cycle de vie d'une partie :

| État     | Valeur    | Description                         |
| -------- | --------- | ----------------------------------- |
| Inactif  | `idle`    | Écran d'accueil avant le début      |
| En cours | `playing` | Partie en cours                     |
| Mort     | `dying`   | Animation de mort en cours          |
| Terminé  | `dead`    | Partie terminée, scores sauvegardés |

```js
// Transitions d'état dans useGame.js
state.value = "playing"; // au démarrage
state.value = "dying"; // à la collision
state.value = "dead"; // après l'animation
```

**Gestion des erreurs** : si la sauvegarde du score échoue, un message d'erreur est affiché dans l'overlay de fin de partie via `saveError`.

```js
// GameView.vue
const saving = ref(false); // chargement
const saved = ref(false); // succès
const saveError = ref(""); // erreur
```

### Flux 2 - Sauvegarde du score (`POST /scores`)

Déclenché automatiquement à la fin de chaque partie :

```
Fin de partie → saveScore() → POST /scores → validation Zod
     ↓                                            ↓
saving = true                              400 si score invalide
     ↓                                            ↓
saved = true                          anti-triche (MAX_SCORE_PER_SECOND)
     ↓                                            ↓
newAchievements débloqués          checkAchievements() → notifications
```

Les erreurs sont visibles dans l'overlay via `saveError` et loggées côté serveur via Pino.

### Flux 3 - Leaderboard (`GET /scores/leaderboard`)

```js
// LeaderboardView.vue
const loading = ref(true); // chargement initial
const error = ref(""); // erreur réseau ou serveur
const scores = ref([]); // données affichées
```

L'utilisateur voit un spinner `LOADING...` pendant le chargement, un message d'erreur clair en cas d'échec, et le tableau vide avec un appel à l'action si aucun score n'existe.

### Flux 4 - Profil et achievements (`ProfileView.vue`)

Quatre requêtes parallèles chargées via `Promise.all` au montage :

```js
const [statsRes, historyRes, allRes, myRes] = await Promise.all([
  getMyStats(), // statistiques agrégées
  getMyScores(), // historique des 10 dernières parties
  getAllAchievements(), // tous les badges disponibles
  getMyAchievements(), // badges débloqués par le joueur
]);
```

Un état `loading` unique couvre les quatre requêtes. En cas d'erreur, les données restent vides sans bloquer l'affichage.

### Flux 5 - Achievements en temps réel

Les achievements sont vérifiés **côté client pendant la partie** (score, niveau, durée) via `ACHIEVEMENT_CONDITIONS` dans `useGame.js`, et **côté serveur à la sauvegarde** via `checkAchievements()` dans `achievementService.js`.

```js
// Notification immédiate dès que la condition est remplie
justUnlocked.value = newUnlocks;
// → AchievementNotification.vue affiche la popup
```

Les badges déjà débloqués sont préchargés au montage pour éviter les faux positifs :

```js
game.preloadUnlocked(alreadyUnlocked); // charge depuis /achievements/me
```

### Flux 6 - Multijoueur temps réel (`useMultiplayer.js`)

Le flux multijoueur gère des états distincts via Socket.io :

| État        | Description                     |
| ----------- | ------------------------------- |
| `idle`      | Pas connecté                    |
| `waiting`   | En attente d'un adversaire      |
| `countdown` | Compte à rebours avant le début |
| `playing`   | Partie en cours                 |
| `finished`  | Partie terminée avec résultats  |
| `abandoned` | L'adversaire a quitté           |

Les erreurs de room (code invalide, room pleine) sont affichées via `errorMsg` directement dans l'interface multijoueur.

### Modularisation API/Service

Chaque flux respecte une séparation stricte des responsabilités :

```
Vue (affichage)
    ↓
client/src/api/*.js (appels HTTP nommés)
    ↓
server/routes/*.js (transport HTTP uniquement)
    ↓
server/services/*.js (logique métier pure)
    ↓
Supabase / Mistral AI
```

Cette architecture garantit que chaque couche peut être testée, modifiée ou remplacée indépendamment.

## Installation

### Prérequis

- Node.js 18+
- Un compte [Supabase](https://supabase.com) (gratuit)
- Une clé API [Mistral AI](https://console.mistral.ai) (gratuite)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd snake-game
```

### 2. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Dans le SQL Editor, exécute le script de création des tables (`users`, `avatars`, `scores`, `achievements`, `user_achievements`)
3. Récupère ton `Project URL` et tes clés API depuis **Project Settings → API**

### 3. Backend

```bash
cd server
npm install
cp .env.example .env
# Remplis .env avec tes clés (voir section ci-dessous)
npm run dev
```

Le serveur démarre sur `http://localhost:3000`.

### 4. Frontend

Dans un second terminal :

```bash
cd client
npm install
cp .env.example .env
# Remplis .env avec tes clés (voir section ci-dessous)
npm run dev
```

Le client démarre sur `http://localhost:5173`.

### 5. Lancer le jeu

Ouvre `http://localhost:5173` dans ton navigateur, crée un compte, choisis un avatar et joue !

## Variables d'environnement

### `server/.env`

| Variable                    | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `SUPABASE_URL`              | URL de ton projet Supabase                             |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase (jamais exposée côté client) |
| `MISTRAL_API_KEY`           | Clé API Mistral AI                                     |
| `MISTRAL_URL`               | Endpoint de l'API Mistral                              |
| `PORT`                      | Port du serveur Express                                |
| `CLIENT_URL`                | URL du frontend (pour CORS)                            |
| `GAME_SPEED_MS`             | Vitesse du snake en multijoueur (ms/tick)              |
| `MAX_SCORE_PER_SECOND`      | Seuil anti-triche pour la validation des scores        |
| `AI_USERNAMES_CACHE_TTL_MS` | Durée du cache des pseudos générés                     |
| `AI_RATE_LIMIT_WINDOW_MS`   | Fenêtre de rate limiting des routes IA                 |
| `AI_RATE_LIMIT_MAX`         | Nombre max de requêtes IA par fenêtre                  |
| `AI_DEMO_RATE_LIMIT_MAX`    | Nombre max de requêtes du mode démo par fenêtre        |

### `client/.env`

| Variable                 | Description                            |
| ------------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`      | URL de ton projet Supabase             |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase           |
| `VITE_SOCKET_URL`        | URL du serveur Socket.io (multijoueur) |

Voir `.env.example` dans chaque dossier pour le détail complet.

## Structure du projet

```
snake-game/
├── client/                    # Frontend Vue 3
│   ├── src/
│   │   ├── api/                # Couche d'abstraction API (scores, users, ai...)
│   │   ├── views/              # Pages (Login, Game, Multiplayer, Profile...)
│   │   ├── components/         # Composants réutilisables (ui/, game/, leaderboard/...)
│   │   ├── composables/        # Logique réutilisable (useGame, useMultiplayer, useSound)
│   │   ├── stores/              # State Pinia (auth)
│   │   ├── lib/                # Clients API et Supabase
│   │   └── router/              # Configuration Vue Router
│   └── public/                  # Assets statiques
│
└── server/                     # Backend Express
    ├── routes/                  # Définition des routes HTTP (fines)
    ├── services/                 # Logique métier (scores, users, IA, jeu...)
    ├── middleware/                # Auth JWT, rate limiting, gestion d'erreurs
    ├── schemas/                   # Schémas de validation Zod
    ├── config/                    # Connexion Supabase, logger Pino
    ├── multiplayer.js             # Transport Socket.io (délègue à gameEngine)
    └── index.js                   # Point d'entrée Express
```

## Scripts disponibles

### Backend (`server/`)

```bash
npm run dev      # Démarre avec nodemon (rechargement auto)
npm start         # Démarre en mode production
```

### Frontend (`client/`)

```bash
npm run dev       # Démarre le serveur de développement Vite
npm run build      # Build de production
npm run preview     # Prévisualise le build de production
```

---

Disponible en ligne : https://poulpentin.albini.fr/
Projet réalisé dans le cadre du cours Développement Front-End / Back-End - 2026
