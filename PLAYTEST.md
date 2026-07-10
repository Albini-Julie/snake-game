# Plan de playtest — Poulpentin

## Objectifs

Vérifier que les fonctionnalités critiques sont stables et utilisables par quelqu'un qui découvre le jeu pour la première fois, avant la présentation finale.

## Participants

- 1 testeur externe (non familier avec le code) : maman
- Moi-même en observation

## Métriques suivies

- Nombre de bugs bloquants rencontrés
- Temps pour comprendre l'interface sans aide
- Taux de complétion de chaque scénario

## Scénarios de test

### Scénario 1 — Inscription et première partie

1. Créer un compte
2. Choisir un avatar
3. Lancer une partie solo
4. Jouer jusqu'à la mort
5. Consulter le conseil IA affiché

**Résultat attendu** : parcours complet sans blocage, score sauvegardé, conseil affiché.

### Scénario 2 — Découverte des fonctionnalités secondaires

1. Consulter le leaderboard
2. Consulter son profil (stats + historique)
3. Lancer le mode démo IA
4. Regarder le replay du record mondial

**Résultat attendu** : navigation intuitive, toutes les pages se chargent sans erreur.

### Scénario 3 — Mobile / tablette

1. Ouvrir le jeu sur tablette
2. Jouer une partie avec les contrôles tactiles

**Résultat attendu** : les flèches directionnelles sont visibles et fonctionnelles.

### Scénario 4 — Multijoueur

1. Ouvrir deux onglets
2. Lancer le matchmaking sur les deux
3. Jouer une partie jusqu'à la fin

**Résultat attendu** : synchronisation correcte entre les deux joueurs, écran de fin cohérent.

## Résultats du playtest

| Scénario                        | Statut     | Bugs rencontrés                                                                                                                      | Correction                                                   |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| 1 — Inscription/partie          | Réussi     | Trouve que le poulpentin va trop vite                                                                                                | Corrigé — diminution de la vitesse du poulpentin             |
| 2 — Fonctionnalités secondaires | Réussi     | Aucun                                                                                                                                | —                                                            |
| 3 — Mobile/tablette             | Bug trouvé | Flèches directionnelles absentes sur tablette                                                                                        | Corrigé — détection tactile via `ontouchstart`               |
| 4 — Multijoueur                 | Réussi     | Les Poulpes se foncent dedans au départ car ils sont en face et pas le temps de comprendre le jeu qu'ils sont déjà l'un dans l'autre | Corrigé — changement des positions de départ des poulpentins |

## Enseignements du playtest

Le playtest a permis de détecter le bug des contrôles tactiles absents sur tablette (scénario 3), qui n'était pas apparu lors des tests sur ordinateur et mobile. Cela confirme l'importance de tester sur plusieurs types d'appareils réels plutôt que seulement en responsive design dans les devtools.

Un second test rapide après correction a confirmé la résolution du problème sur tablette.

Le retour sur la vitesse ressentie trop rapide (scénario 1) a été pris en compte en réduisant la vitesse de base du poulpe, tout en conservant la progression de difficulté par niveau.

Le retour sur les poulpes se percutant dès le départ en multijoueur (scénario 4) a motivé la modification des positions de départ dans `gameEngine.js`, pour laisser aux deux joueurs le temps de s'orienter avant tout risque de collision.
