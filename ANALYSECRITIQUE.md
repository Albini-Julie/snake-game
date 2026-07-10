# Analyse critique - Poulpentin

Bilan de fin de module sur le projet fil rouge, synthétisant les points forts, les points faibles, et une feuille de route post-module.

---

## 1. Points forts

### Architecture

- Séparation stricte routes/services côté backend : aucune logique métier dans les routes Express
- `gameEngine.js` totalement découplé de Socket.io : module pur testable indépendamment du transport réseau
- Couche `api/` côté client qui reflète la structure du service layer côté serveur : architecture symétrique et lisible

### Fonctionnalités

- Périmètre largement dépassé par rapport au document de cadrage initial (3 tables prévues → 5 tables, fonctionnalités bonus : achievements, multijoueur, replay, sons)
- 3 fonctionnalités IA réellement opérationnelles et distinctes (génération de pseudos, conseils de jeu, pilotage en mode démo), pas de simple mock
- Système de replay basé sur un RNG déterministe (Mulberry32) : solution technique avancée pour un problème important (reproductibilité d'une partie aléatoire)

### Sécurité

- Authentification déléguée à Supabase Auth (hashage bcrypt géré nativement, pas de réinvention de la roue)
- Validation systématique des entrées via Zod côté serveur
- Anti-triche sur les scores (cohérence score/durée vérifiée serveur)
- Rate limiting sur les routes IA pour protéger le quota Mistral

### Démarche projet

- Déploiement réel en production (Vercel + Railway + domaine personnalisé)
- Playtest mené avec un testeur externe, ayant réellement fait remonter des bugs corrigés ensuite
- Documentation complète : README, AUDIT, CHANGELOG, BUGS, PLAYTEST, UI_GUIDE

---

## 2. Points faibles

### Tests et qualité

- Aucun test automatisé (unitaire ou end-to-end), bien que hors périmètre du module, `gameEngine.js` s'y prêterait particulièrement bien de par sa nature de fonctions pures
- Validation manuelle systématique mais non reproductible automatiquement

### Gestion de projet

- Pas d'Issues ni de Pull Requests GitHub : développement en commits directs sur `main`, sans traçabilité de discussion ou de revue de code
- Une seule branche de fonctionnalité isolée (`succes-system`) sur l'ensemble du projet

### Robustesse

- Plusieurs bugs de déploiement liés à la casse des fichiers (Windows vs Linux), révélant un manque de vérification de compatibilité multi-OS en amont
- État du multijoueur conservé en mémoire serveur (`Map` JS) : ne scalerait pas sur plusieurs instances serveur (nécessiterait Redis ou équivalent en production réelle)
- Le replay n'est pas fidèle si rejoué sur un écran de taille différente de celui où il a été enregistré (grille dépendante de la résolution)

### Documentation technique

- Conventions de code présentes mais non vérifiées automatiquement (pas de linter configuré type ESLint/Prettier avec règles strictes)

---

## 3. Parties à refactoriser en priorité

| Priorité | Partie concernée | Refactorisation proposée                                                                                                                                                                                         |
| -------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Haute    | `gameEngine.js`  | Extraire des tests unitaires purs (Vitest), le module s'y prête parfaitement                                                                                                                                     |
| Haute    | État multijoueur | Remplacer le `Map` en mémoire par Redis pour permettre une scalabilité horizontale                                                                                                                               |
| Moyenne  | Workflow Git     | Adopter une stratégie de branches par fonctionnalité + Pull Requests, même en solo, pour garder un historique de revue                                                                                           |
| Moyenne  | `useGame.js`     | Fichier volumineux (300+ lignes) qui mélange dessin Canvas, logique de jeu et gestion des achievements : pourrait être scindé en plusieurs composables (`useGameLoop`, `useGameRenderer`, `useGameAchievements`) |
| Basse    | CSS/Tailwind     | Extraire les classes répétées (`shadow-pixel-card`, `font-game text-pixel-sm`) en composants réutilisables plutôt que dupliquées dans chaque vue                                                                 |

---

## 4. Apports du module pour le projet fil rouge

Ce module a permis de structurer une méthodologie complète de développement fullstack, au-delà du simple code :

- **Authentification sécurisée** : compréhension du cycle de vie JWT, hashage, middleware de vérification : directement réutilisable sur tout projet nécessitant une auth
- **API REST propre** : la discipline routes/services acquise ici sera systématiquement réappliquée
- **Gestion d'état structurée** : la distinction claire loading/success/error sur chaque flux est devenue un réflexe
- **Audit et optimisation** : la démarche d'audit (identifier → prioriser → mesurer les gains) est une compétence transférable à n'importe quel projet existant
- **Déploiement réel** : la résolution concrète de problèmes de production (CORS, casse de fichiers, variables d'environnement) constitue une expérience directement réutilisable
- **Recul critique** : la capacité à identifier soi-même les limites d'un projet (plutôt que de le présenter comme parfait)

---

## 5. Risques identifiés (feuille de route post-module)

| Risque                                                               | Impact | Probabilité | Priorité |
| -------------------------------------------------------------------- | ------ | ----------- | -------- |
| Bug de compatibilité navigateur non testé (Safari, Firefox)          | Moyen  | Moyenne     | Haute    |
| Quota Mistral AI dépassé en cas de forte utilisation lors de la démo | Élevé  | Faible      | Haute    |
| Oubli de variable d'environnement lors d'une future modification     | Moyen  | Moyenne     | Moyenne  |

---

## 6. Plan d'action priorisé

### Avant la soutenance (fait dans le cadre de ce TP)

1. Vérifier que le déploiement en ligne est stable (`poulpentin.albini.fr`)
2. Tester le parcours complet de démo une dernière fois (login → jeu → leaderboard → multijoueur → replay)
3. Vérifier que les variables d'environnement Railway/Vercel sont à jour et cohérentes

### Post-module

1. Ajouter des tests unitaires sur `gameEngine.js` (Vitest)
2. Mettre en place ESLint + Prettier avec une configuration partagée pour garantir la cohérence du style de code
3. Migrer l'état multijoueur vers Redis si le projet doit supporter plusieurs instances serveur
4. Découper `useGame.js` en composables plus petits et responsabilités uniques
5. Ajouter un pipeline CI simple (GitHub Actions) pour lancer les futurs tests automatiquement à chaque push

---

## 7. Conclusion

Le projet dépasse largement le périmètre fonctionnel initialement défini dans le document de cadrage, tout en conservant une architecture cohérente et documentée. Les principales faiblesses concernent la démarche de gestion de projet (traçabilité Git, tests automatisés) plutôt que le code lui-même, qui reste solide et bien structuré. La feuille de route post-module identifie des actions concrètes et réalistes pour faire évoluer le projet vers un niveau de maturité supérieur si celui-ci devait être maintenu au-delà du cadre du module.
