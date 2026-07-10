# Changelog — Poulpentin

## Corrections critiques

### Bug replay — désynchronisation des inputs

**Problème** : le replay du record mondial déviait après quelques secondes, le poulpe prenant des directions jamais jouées par le joueur original.
**Cause** : les inputs étaient enregistrés avec un timestamp (`Date.now() - startTime`), mais la vitesse du jeu change avec le niveau : le timing réel ne correspondait plus aux ticks au moment du replay.
**Correction** : passage à un enregistrement par **numéro de tick** (`{ dir, tick }`) au lieu du timestamp. Le replay applique désormais les inputs exactement au même tick que l'original, garantissant une reproduction fidèle à 100%.
**Fichiers modifiés** : `client/src/composables/useGame.js`, `client/src/views/ReplayView.vue`, `server/schemas/index.js`

### Correction casse des fichiers (Windows → Linux)

**Problème** : le déploiement en production (Vercel/Railway, environnement Linux) échouait avec des erreurs `ENOENT` / `ERR_MODULE_NOT_FOUND`.
**Cause** : plusieurs fichiers avaient une casse incorrecte (ex : `Loginview.vue` au lieu de `LoginView.vue`). Windows ignore la casse des fichiers, Git ne détectait donc pas les changements de casse seuls, mais Linux (utilisé en production) est sensible à la casse.
**Correction** : renommage de tous les fichiers concernés via une étape intermédiaire (`git mv` vers un nom temporaire puis vers le nom final) pour forcer Git à enregistrer le changement.
**Fichiers concernés** : `LoginView.vue`, `WorldRecordNotification.vue`, `AchievementBadge.vue`, `AiUsernameSuggestions.vue`, `useMultiplayer.js`, `errorHandler.js`, `rateLimiter.js`

### CORS multi-origines en production

**Problème** : après déploiement, les requêtes API et Socket.io étaient bloquées par la politique CORS.
**Cause** : le serveur n'acceptait qu'une seule origine (`CLIENT_URL`), alors que le frontend était accessible depuis plusieurs URLs (Vercel + domaine custom).
**Correction** : configuration CORS acceptant un tableau de plusieurs origines valides côté Express et Socket.io.
**Fichiers modifiés** : `server/index.js`

### Contrôles tactiles absents sur tablette

**Problème** : les boutons de direction (▲◄▼►) n'apparaissaient que sur mobile, laissant les joueurs sur tablette sans moyen de contrôler le jeu.
**Correction** : détection du support tactile via `'ontouchstart' in window` au lieu d'une media query basée uniquement sur la largeur d'écran.
**Fichiers modifiés** : `client/src/views/GameView.vue`, `client/src/views/MultiplayerView.vue`

### Positions de départ multijoueur face à face

**Problème** : les deux poulpes démarraient face à face, rendant les premières secondes de jeu peu intéressantes car les poulpentins se rentraient dedans si les joueurs n'étaient pas très
réactifs.
**Correction** : modification des positions de départ dans `createGameState` (côté serveur) pour un placement moins direct.
**Fichiers modifiés** : `server/services/gameEngine.js`

## Optimisations

- Ajout de deux index BDD (`idx_scores_user_id`, `idx_scores_value`) : passage de requêtes O(n) à O(log n)
- Cache mémoire pour `getAllAchievements()` : réduction des appels HTTP redondants (2 → 1 par session)
- Vérification et confirmation du lazy loading sur toutes les routes Vue Router

## Limites connues (non corrigées, assumées)

- Le replay enregistré sur un écran desktop (grille 20x20) ne se rejoue pas fidèlement sur mobile (grille 16x16) car la taille de grille dépend de la résolution d'écran au moment de la partie. Accepté comme limite technique du projet.
- Pas de tests automatisés. Validation manuelle systématique après chaque correction.
