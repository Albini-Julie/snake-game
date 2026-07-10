# Guide de style UI — Poulpentin

Mini-guideline décrivant les conventions visuelles utilisées dans le projet, pour garantir une cohérence entre les composants.

## Palette de couleurs

| Usage                  | Couleur                   | Variable Tailwind |
| ---------------------- | ------------------------- | ----------------- |
| Fond principal         | `#0f172a` (bleu nuit)     | `game-bg`         |
| Accent principal       | `#6366f1` (indigo)        | `game-accent`     |
| Bordures               | Gris ardoise              | `game-border`     |
| Surface (cartes)       | Bleu nuit translucide     | `game-surface`    |
| Succès / record        | Jaune (`yellow-400`)      | —                 |
| Erreur / danger        | Rouge (`game-danger`)     | `game-danger`     |
| Joueur 1 (multijoueur) | Bleu (`hsl(210, 80%, *)`) | —                 |
| Joueur 2 (multijoueur) | Rouge (`hsl(0, 80%, *)`)  | —                 |

## Typographie

- **Police unique** : `Press Start 2P` (Google Fonts) : style pixel art rétro sur toute l'interface
- **Classe utilitaire** : `font-game`
- **Tailles** : `text-pixel-xs`, `text-pixel-sm`, `text-pixel-md`, `text-pixel-lg`, `text-pixel-xl` (échelle personnalisée dans `tailwind.config.js`)
- Les titres importants (WORLD RECORD, GAME OVER...) sont en majuscules avec un effet `text-shadow-accent-glow`

## Composants réutilisables

| Composant       | Usage                                                           |
| --------------- | --------------------------------------------------------------- |
| `AppButton.vue` | Bouton principal (`variant="primary"` ou `variant="secondary"`) |
| `AppInput.vue`  | Champ de saisie avec label intégré                              |
| `AppCard.vue`   | Conteneur avec bordure et ombre pixel art                       |
| `AppIcon.vue`   | Icônes SVG pixel art (search, add, link...)                     |

## Effets visuels caractéristiques

- **Bordures nettes** : `border-2`, jamais de `border-radius` (esthétique pixel art carrée)
- **Ombres pixel** : classe `shadow-pixel-card` : ombre portée décalée sans flou
- **Scanlines CRT** : overlay subtil en `repeating-linear-gradient` sur toute l'application, simulant un vieil écran
- **Vignette** : assombrissement des bords de l'écran (`radial-gradient`)
- **Transitions entre pages** : effet "CRT flash" (`scaleY` + `brightness`) en `steps()` pour un rendu saccadé rétro
- **Curseur personnalisé** : croix blanche pixel art en SVG inline, visible sur tout fond sombre

## Sons

- Générés via Web Audio API (pas de fichiers audio externes) dans `useSound.js`
- Sons courts et synthétiques pour : clic bouton, achievement débloqué, record mondial battu

## Responsive

- Desktop / mobile : détection de largeur d'écran (canvas 400x400 ou 320x320)
- Contrôles tactiles : détection du support tactile réel (`'ontouchstart' in window`), affichés sur mobile et tablette indépendamment de la largeur d'écran

## Principe général

Toute nouvelle interface doit respecter l'identité **pixel art rétro années 80-90** : angles droits, palette limitée, police unique, effets CRT. Éviter les éléments "modernes" (coins arrondis, ombres douces, dégradés complexes) qui casseraient la cohérence visuelle.
