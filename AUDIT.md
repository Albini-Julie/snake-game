# Rapport d'audit technique - Poulpentin

## 1. Périmètre de l'audit

Audit réalisé sur le projet Poulpentin (Snake JS) : stack Vue 3 + Express + Supabase + Mistral AI.

---

## 2. Problèmes détectés

### API

| Problème                                                                         | Impact                                                                              | Priorité |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------- |
| Table `scores` sans index sur `user_id` et `value`                               | Requêtes leaderboard et stats en scan complet : dégradation linéaire avec le volume | Haute    |
| `getAllAchievements()` appelé deux fois par session (`GameView` + `ProfileView`) | Double requête réseau inutile sur une liste statique qui ne change jamais           | Moyenne  |
| `POST /ai/advice` sans cache                                                     | Latence Mistral (1-3s) à chaque fin de partie, quota consommé inutilement           | Faible   |

### Frontend

| Problème                                            | Impact                                                             | Priorité |
| --------------------------------------------------- | ------------------------------------------------------------------ | -------- |
| Lazy loading des routes non vérifié                 | Risque de bundle JS initial trop lourd                             | Haute    |
| Police `Press Start 2P` chargée depuis Google Fonts | Bloque potentiellement le rendu initial (render-blocking resource) | Moyenne  |

### Base de données

| Problème                                 | Impact                                                            | Priorité |
| ---------------------------------------- | ----------------------------------------------------------------- | -------- |
| Absence d'index sur `scores(user_id)`    | Requêtes `GET /scores/me` et `GET /scores/stats` en full scan     | Haute    |
| Absence d'index sur `scores(value DESC)` | Requête `GET /scores/leaderboard` en full scan                    | Haute    |
| Pas de système de migrations documenté   | Difficile de reproduire le schéma BDD sur un nouvel environnement | Moyenne  |

---

## 3. Actions d'optimisation menées

### Optimisation 1 - Index BDD sur la table `scores`

**Problème** : les requêtes sur la table `scores` effectuaient un scan complet à chaque appel, ce qui aurait dégradé les performances de façon linéaire avec l'augmentation du nombre de parties enregistrées.

**Action** : création de deux index dans Supabase :

```sql
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_value ON scores(value DESC);
```

**Impact** :

- `idx_scores_user_id` : accélère `GET /scores/me` et `GET /scores/stats` qui filtrent par `user_id`
- `idx_scores_value` : accélère `GET /scores/leaderboard` qui trie par `value DESC` et limite à 10 résultats

Ces deux requêtes passent d'une complexité O(n) à O(log n) grâce aux index B-tree.

---

### Optimisation 2 - Cache en mémoire pour `getAllAchievements()`

**Problème** : la liste des achievements est une donnée statique (elle ne change pas pendant une session utilisateur) mais était rechargée depuis l'API à chaque montage de `GameView.vue` et `ProfileView.vue`, générant deux requêtes HTTP identiques par visite.

**Action** : création d'un module de cache léger (`client/src/api/cache.js`) et modification de `getAllAchievements()` pour stocker le résultat en mémoire :

```js
// client/src/api/cache.js
const store = {};

export function getCached(key) {
  return store[key] ?? null;
}
export function setCached(key, value) {
  store[key] = value;
}
```

```js
// client/src/api/achievements.js
export async function getAllAchievements() {
  const cached = getCached("achievements");
  if (cached) return { data: cached };

  const result = await api.get("/achievements");
  setCached("achievements", result.data);
  return result;
}
```

**Impact** : le premier appel charge les données depuis l'API, tous les appels suivants dans la même session utilisent le cache en mémoire : réduction du nombre de requêtes réseau sur cette route de 2 à 1 par session.

---

### Optimisation 3 - Vérification du lazy loading des routes

**Constat** : toutes les routes Vue Router utilisaient déjà le chargement différé via `() => import(...)`. Le bundle initial ne charge donc que le code strictement nécessaire à la page courante, les autres vues étant chargées à la demande.

```js
// Toutes les routes en lazy loading
component: () => import("@/views/GameView.vue");
```

Aucune action corrective nécessaire : bonne pratique déjà en place.

---

## 4. Gains mesurés

| Optimisation                            | Avant                      | Après                          |
| --------------------------------------- | -------------------------- | ------------------------------ |
| Requête leaderboard                     | Scan complet O(n)          | Index B-tree O(log n)          |
| Requête scores par user                 | Scan complet O(n)          | Index B-tree O(log n)          |
| Appels `getAllAchievements` par session | 2 requêtes HTTP            | 1 requête HTTP (cache mémoire) |
| Chargement initial JS                   | Lazy loading déjà en place | Inchangé                       |

---

## 5. Points non traités (backlog)

- Mise en place d'un système de migrations BDD documenté
- Cache serveur sur `POST /ai/advice` (éviter les appels Mistral répétés pour des scores similaires)
- Optimisation de la police Google Fonts (preconnect, font-display: swap)
