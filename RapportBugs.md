# Rapport de bugs — Poulpentin

Ce document liste les bugs identifiés pendant le développement et les playtests, leur statut et leur résolution. Voir aussi [CHANGELOG.md](./CHANGELOG.md) pour le détail technique des corrections.

## Bugs corrigés

| #   | Bug                                                                                    | Sévérité | Origine       | Statut  |
| --- | -------------------------------------------------------------------------------------- | -------- | ------------- | ------- |
| 1   | Replay du record mondial déviant après quelques secondes                               | Critique | Développement | Corrigé |
| 2   | Déploiement en échec : casse de fichiers incompatible Linux                            | Critique | Déploiement   | Corrigé |
| 3   | Erreurs CORS bloquant l'API et Socket.io en production                                 | Critique | Déploiement   | Corrigé |
| 4   | Contrôles tactiles absents sur tablette                                                | Majeur   | Playtest      | Corrigé |
| 5   | Poulpes multijoueur se percutant dès le lancement de la partie                         | Mineur   | Playtest      | Corrigé |
| 6   | Vitesse de jeu perçue comme trop rapide dès le niveau 1                                | Mineur   | Playtest      | Corrigé |
| 7   | Import incorrect du logger dans `multiplayer.js` (chemin absolu invalide)              | Majeur   | Déploiement   | Corrigé |
| 8   | Variable `VITE_SOCKET_URL` manquante en production (Socket.io pointait vers localhost) | Critique | Déploiement   | Corrigé |

## Bugs connus non corrigés (limitations assumées)

| #   | Bug                                                                                                   | Sévérité | Raison de non-correction                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9   | Le replay enregistré sur desktop (grille 20x20) ne se rejoue pas fidèlement sur mobile (grille 16x16) | Mineur   | La taille de grille dépend de la résolution d'écran au moment de la partie ; corriger nécessiterait de fixer une grille unique quel que soit l'écran, ce qui dégraderait l'expérience de jeu normale |

## Méthodologie de détection

- Bugs 1, 2, 3, 7, 8 : détectés lors du développement et du déploiement, corrigés au fil de l'eau
- Bugs 4, 5, 6 : détectés lors du playtest du 05/07 avec un testeur externe (voir [PLAYTEST.md](./PLAYTEST.md))
