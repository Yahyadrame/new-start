# 17 — Écran de démarrage (splash screen)

Ticket : **NS-041 — Écran de démarrage animé** · taille S (la maquette l'appelait NS-015, numéro déjà pris par les générateurs)
Maquette animée : `design/maquette-ecran-demarrage.html` (ouvrir dans le navigateur) et en ligne : <https://claude.ai/artifact/4brvZ4RHqi5FQnJBy5kU89>. Étapes image par image : `design/ecran-demarrage-etapes.png`.

Ce document fait foi pour cet écran. Choix validé par le porteur du projet le 2026-11-25 : ne pas le reposer.

## Décision

| Moment                                         | Animation                    | Durée                                   |
| ---------------------------------------------- | ---------------------------- | --------------------------------------- |
| Toute première ouverture (avant l'inscription) | Piste 3 « La correction »    | 2,7 s                                   |
| Toutes les autres ouvertures                   | Piste 1 « La bulle s'ouvre » | 1,3 s (0,8 s si l'appli est déjà prête) |

## Enchaînement

1. **Écran fixe du système** : fond `#000000`, icône bulle N au centre. Dans la PWA, il vient du manifeste (`background_color: "#000000"`, `theme_color: "#000000"`, icônes 192 et 512). En V2 (Expo), de `expo-splash-screen` avec la même image.
2. **Animation** : elle reprend exactement le même fond et la même icône, à la même taille et à la même position, pour que le passage soit invisible.
3. **Écran suivant** : Bienvenue (première ouverture) ou Discussions (utilisateur connecté), en fondu de 200 ms.

## Piste 1 — « La bulle s'ouvre »

- Fond `#000000` dans les deux thèmes (c'est l'écran de marque).
- 0 → 0,7 s : l'icône (96 px) passe de l'échelle 0,4 à 1, opacité 0 → 1, avec un léger rebond (`cubic-bezier(.2,1.4,.4,1)`).
- 0,45 → 1 s : le N se trace dans la bulle (`stroke-dashoffset` de 100 à 0, `pathLength="100"`).
- 0,9 → 1,3 s : le mot « New Start » (Space Grotesk 700, 24 px, `#F2F2F2`) monte de 8 px en apparaissant.

## Piste 3 — « La correction »

- 0 → 0,2 s : « I am agree » apparaît (Inter 600, 22 px, `#F2F2F2`).
- 0,5 → 0,8 s : « am » est barré d'un trait `#999999`.
- 0,8 → 1,15 s : la pastille `#CCFF00` « I agree », avec une coche, apparaît dessous.
- 1,45 → 1,8 s : les deux lignes disparaissent vers le haut.
- 1,8 → 2,7 s : l'animation de la piste 1 (icône, N, mot).

## Règles

- **À chaque chargement ou rechargement** de la page, et **au retour dans l'appli après 5 minutes ou plus** en arrière-plan (`visibilitychange`, `pageshow`). Jamais en changeant d'écran. Mêmes durées dans tous les cas (décision NS-043).
- **Première ouverture** détectée par un drapeau local (`localStorage`, clé `ns.firstLaunchDone`) ; en cas d'erreur de stockage, jouer la piste 1.
- **Raccourcie** à 0,8 s si les données sont déjà prêtes : **pas encore faite**, l'animation dure toujours 1,3 s. **Jamais plus longue** que la durée prévue : si le chargement continue, l'écran suivant affiche ses squelettes.
- **Un toucher ou la touche Entrée/Échap** saute l'animation.
- **Tests** : la clé locale `ns.splash` à `off` coupe l'écran ; la configuration Playwright la pose par défaut, et seul `e2e/splash.spec.ts` l'enlève.
- **`prefers-reduced-motion`** : l'icône et le mot s'affichent directement, sans mouvement, pendant 0,4 s.
- **Accessibilité** : le conteneur a `role="img"` et `aria-label="New Start"` ; les éléments animés sont `aria-hidden`.
- Pas de son, pas de vibration.

## Mise en œuvre (Next.js)

- Composant `features/splash/splash-screen.tsx`, animé en CSS (`splash.module.css`), sans bibliothèque : le logo est en SVG inline, avec le même tracé que `design/logo-icon.svg`.
- Monté dans le layout racine, au-dessus de l'appli, puis retiré du DOM à la fin.
- Durées dans un seul fichier, `features/splash/timeline.ts` : `first` 2 700 ms, `regular` 1 300 ms, `reduced` 400 ms, fondu de sortie 200 ms.

## Critères d'acceptation

- [x] Première ouverture : piste 3, puis Bienvenue ; ouvertures suivantes : piste 1, puis Discussions.
- [ ] Aucun saut visible entre l'écran fixe du système et l'animation (vérifié sur un téléphone Android dans Chrome, PWA installée).
- [x] Un toucher saute l'animation ; la réduction des animations est respectée.
- [x] Tests : unitaires sur le choix de la piste et le saut ; test Playwright qui vérifie l'enchaînement et la durée maximale.
- [x] Testé en local (`docker compose --profile dev up`) et sur le lien d'aperçu de la PR.
