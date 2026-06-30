# Poulpentin

Un jeu de Snake revisité avec un poulpe, développé dans le cadre du cours de développement Front-End/Back-end. Le projet implémente une architecture client/serveur complète avec authentification, persistance des données, fonctionnalités IA et mode multijoueur en temps réel.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)

## Fonctionnalités

- **Authentification** — inscription et connexion via Supabase Auth
- **Avatars personnalisables** — choix parmi plusieurs poulpes colorés
- **Jeu Snake solo** — rendu Canvas HTML5, niveaux de difficulté progressifs
- **Mode démo IA** — un poulpe piloté automatiquement par Mistral AI
- **Conseils de jeu personnalisés** — générés par IA après chaque partie
- **Pseudos générés par IA** — suggestions à l'inscription
- **Mode multijoueur** — deux joueurs en temps réel via WebSockets (matchmaking automatique ou room avec code)
- **Leaderboard** — classement global des meilleurs scores
- **Profil joueur** — statistiques personnelles et historique des parties
- **Système d'achievements** — badges débloqués selon les performances

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
│   │   ├── views/              # Pages (Login, Game, Multiplayer, Profile...)
│   │   ├── components/         # Composants réutilisables (ui/, game/, leaderboard/...)
│   │   ├── composables/        # Logique réutilisable (useGame, useMultiplayer)
│   │   ├── stores/              # State Pinia (auth)
│   │   ├── lib/                # Clients API et Supabase
│   │   └── router/              # Configuration Vue Router
│   └── public/                  # Assets statiques
│
└── server/                     # Backend Express
    ├── routes/                  # Définition des routes HTTP (fines)
    ├── services/                 # Logique métier (scores, users, IA, jeu...)
    ├── middleware/                # Auth, rate limiting, gestion d'erreurs
    ├── schemas/                   # Schémas de validation Zod
    ├── config/                    # Connexion Supabase, logger
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
