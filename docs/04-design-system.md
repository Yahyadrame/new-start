# 04 — Design system

## Identité

- **Nom** : New Start, écrit « new start » en minuscules dans le logotype.
- **Logo retenu** : la **bulle N**. Une bulle de message noire avec un N tracé en vert, sur une icône carrée arrondie verte. Fichiers : `design/logo-icon.svg` (icône), `design/logo-full-dark.svg` et `design/logo-full-light.svg` (icône + nom).
- **Ton** : simple, chaleureux, direct. On tutoie. On ne dit jamais « Erreur » mais « Plus naturel ».

## Couleurs

Palette de base : `#CCFF00`, `#000000`, `#999999`, `#F2F2F2`. Les nuances de surface sont dérivées pour la lisibilité.

| Jeton | Sombre | Clair | Usage |
| --- | --- | --- | --- |
| `--color-bg` | `#000000` | `#FFFFFF` | Fond des écrans |
| `--color-surface-1` | `#121212` | `#F2F2F2` | Cartes, bulles des contacts, champs |
| `--color-surface-2` | `#1F1F1F` | `#E4E4E4` | Avatars, éléments secondaires |
| `--color-line` | `#2A2A2A` | `#E2E2E2` | Séparateurs, bordures |
| `--color-text` | `#F2F2F2` | `#000000` | Texte principal |
| `--color-text-muted` | `#999999` | `#666666` | Texte secondaire |
| `--color-accent` | `#CCFF00` | `#CCFF00` | Bouton principal, mes bulles, badges, onglet actif |
| `--color-on-accent` | `#000000` | `#000000` | Texte et icônes posés sur l'accent |
| `--color-accent-text` | `#CCFF00` | `#000000` | Liens et mots mis en valeur |
| `--color-danger` | `#E5484D` | `#E5484D` | Uniquement « Raccrocher » et suppressions |

Règles :

1. En clair, le vert n'est **jamais** une couleur de texte (contraste insuffisant sur blanc) : il reste un fond, avec du noir dessus.
2. En clair, le gris secondaire est `#666666` (et non `#999999`, illisible sur blanc).
3. Le vert est rare : un seul élément vert dominant par écran, plus les badges.
4. Thème par défaut : celui du système (`prefers-color-scheme`) ; l'utilisateur peut forcer Clair ou Sombre dans le profil.

## Typographie

| Rôle | Police | Graisse | Taille |
| --- | --- | --- | --- |
| Titre d'écran | Space Grotesk | 700 | 30 px, interlettrage −0,02 em |
| Grand titre (bienvenue, abonnement) | Space Grotesk | 700 | 34 à 44 px |
| Corps | Inter | 400 à 500 | 15 à 16 px, interligne 1,45 |
| Nom de contact, bouton | Inter | 600 à 700 | 15 à 17 px |
| Libellé en capitales | Inter | 700 | 12 px, +0,08 em |
| Méta (heure, compteur) | Inter | 400 | 11 à 13 px, chiffres tabulaires |

Polices chargées avec `next/font` (auto-hébergées, pas d'appel à Google en production).

## Formes et espacements

- Rayons : boutons et pilules `999px` ; cartes `20 à 28px` ; bulles `18px` avec le coin de la queue à `6px` ; icône d'appli `24 %` de la largeur.
- Espacements sur une grille de 4 px : 4, 8, 12, 16, 20, 24, 32.
- Marges latérales des écrans : 20 px (16 px minimum).
- Cibles tactiles : 44 px minimum ; bouton principal 56 px de haut.

## Composants

| Composant | Description | Écrans |
| --- | --- | --- |
| `BottomNav` | 4 onglets : Discussions, Série, Jeux, Progrès ; onglet actif = pilule verte derrière l'icône | 3, 6, 7, 9 |
| `ContactRow` | Avatar + point « en ligne », nom, rôle en capitales, dernier message, heure, badge non lus | 3 |
| `StoryRing` | Avatar dans un anneau vert (non vu) ou gris (vu) | 3 |
| `ChatBubble` | Contact : surface-1 à gauche ; moi : accent à droite, coches de lecture | 4 |
| `CorrectionCard` | Libellé « PLUS NATUREL », phrase corrigée, explication, boutons « Répéter à voix haute » et « Ajouter au carnet » | 4 |
| `VoiceNote` | Bouton lecture, barres d'onde, durée | 2, 4 |
| `SuggestionChips` | Pilules de réponses suggérées défilant à l'horizontale | 4 |
| `Composer` | Champ arrondi + bouton micro vert (devient « Envoyer » quand on tape) | 4 |
| `CallControls` | Boutons ronds 60 à 64 px : micro, caméra, FR, haut-parleur, raccrocher | 5, 13 |
| `LiveCaption` | Carte sous-titre EN + traduction FR | 5, 13, 14 |
| `EpisodeCard` | Carte verte de l'épisode du jour, grand numéro en filigrane | 6 |
| `GameTile` | Icône, titre, compétence et durée, badge « Nouveau » | 7 |
| `TimerRing` | Anneau de compte à rebours | 8 |
| `StatTile`, `WeekBars` | Chiffre clé, barres des minutes par jour (jour courant en vert) | 9 |
| `PlanOption` | Carte radio d'offre, badge « Le plus choisi » | 10 |
| `ThemeSegmented` | Système / Clair / Sombre | 16 |
| `EmptyState` | Illustration des bulles, titre, phrase, action | 17 |

Les composants vivent dans `packages/ui`, chacun avec une story (Storybook) en clair et en sombre.

## Bibliothèques d'interface (obligatoires)

On ne réinvente pas ce que les meilleures applis utilisent déjà. Tout composant de base vient d'une bibliothèque reconnue, habillée avec nos jetons.

| Besoin | Bibliothèque (web) | Mobile V2 |
| --- | --- | --- |
| Composants de base (bouton, champ, modale, menu, onglets, bascule, case, radio, info-bulle, feuille du bas) | **shadcn/ui** sur **Radix UI** (accessibles, clavier, lecteurs d'écran) | **React Native Reusables** (mêmes API que shadcn) |
| Styles | **Tailwind CSS** + `tailwind-merge` + `class-variance-authority` (variantes typées) | **NativeWind** |
| Icônes | **Lucide** (`lucide-react`), trait 2 px, une seule famille dans toute l'appli | `lucide-react-native` |
| Avatars | `Avatar` de shadcn/Radix : photo, puis initiales en repli | même composant natif |
| Feuille du bas (mobile) | **Vaul** | `@gorhom/bottom-sheet` |
| Notifications à l'écran (toasts) | **Sonner** | `sonner-native` |
| Animations | **Motion** (ex-Framer Motion), courtes (150 à 250 ms), désactivées si `prefers-reduced-motion` | **Reanimated** |
| Formulaires | **React Hook Form** + Zod | idem |
| Données serveur, cache, synchronisation | **TanStack Query** | idem |
| Listes longues (messages) | **TanStack Virtual** | `FlashList` |
| État client léger | **Zustand** | idem |
| Graphiques (progrès) | **Recharts** | `victory-native` |
| Dates | **date-fns** (locale fr) | idem |
| Traduction de l'interface | **next-intl** | `i18next` |
| Lecteur audio, onde | **wavesurfer.js** | `react-native-audio-api` ou équivalent |
| Polices | `next/font` (Space Grotesk, Inter auto-hébergées) | `expo-font` |

Règles :

- Avant d'écrire un composant, vérifier s'il existe dans shadcn/ui ou Radix. Si oui, l'utiliser.
- Les composants shadcn sont copiés dans `packages/ui` puis adaptés à nos jetons ; on ne les modifie pas au point de casser leur accessibilité.
- Une seule bibliothèque par besoin. Toute nouvelle bibliothèque passe par une question de choix au porteur du projet (voir `16-delegation-supervision.md`).
- Versions figées dans `package.json`, mises à jour par Renovate.

## Visuels des contacts et de la série

- **Avatars des contacts IA** : de vrais portraits illustrés, originaux, dans un style unique et constant (même lumière, même cadrage, même rendu), générés puis retouchés à la main. Jamais de silhouette grise ni d'initiales pour un contact IA en production (les initiales restent le repli pendant le chargement).
- **Avatar de l'utilisateur** : sa photo s'il en ajoute une, sinon ses initiales sur fond `surface-2`.
- **Illustrations de la série** : mêmes règles, une fiche de personnage de référence par héros pour garder les visages identiques d'un épisode à l'autre.
- Images servies en WebP/AVIF, tailles adaptées à l'écran (`next/image`), floutage de chargement.

## Humaniser l'interface : supprimer tout ce qui fait « généré par IA »

L'appli doit donner l'impression d'avoir été dessinée avec soin par une équipe, comme WhatsApp ou Revolut. À vérifier sur chaque écran avant fusion :

| On enlève | On met à la place |
| --- | --- |
| Dégradés violets ou bleus, halos, effets « néon » gratuits | Aplats de la palette, un seul accent vert par écran |
| Emojis utilisés comme icônes ou comme puces | Icônes Lucide, ou rien |
| Icône « étincelles ✨ » pour signaler l'IA | Le badge texte « IA », sobre |
| Cartes arrondies partout, ombres partout | Des listes et des séparateurs ; une carte seulement quand elle isole quelque chose |
| Textes vagues (« Libérez votre potentiel », « Découvrez une expérience unique ») | Phrases concrètes et courtes (« Jade t'a écrit », « 12 expressions à revoir ») |
| Faux chiffres, faux avis, « +10 000 utilisateurs » inventés | Seulement des chiffres réels |
| Tout centré, tout de la même taille | Hiérarchie claire : un titre, une action principale, le reste discret |
| Espacements irréguliers, alignements approximatifs | Grille de 4 px, mêmes marges sur tous les écrans |
| Texte coupé, mots qui débordent, icônes de tailles différentes | Textes qui passent à la ligne, icônes en 20 ou 24 px uniquement |
| Animations lentes ou rebondissantes partout | Une transition courte là où elle aide à comprendre (envoi d'un message, ouverture d'une feuille) |
| Écrans vides ou blancs pendant le chargement | Squelettes, puis contenu |
| Messages d'erreur techniques (« Error 500 ») | « Le message n'est pas parti. Touche pour réessayer. » |
| Tutoiement et vouvoiement mélangés, majuscules au hasard | Tutoiement partout, majuscule seulement en début de phrase |

Détails qui font « vraie appli » :

- Retour haptique léger sur mobile à l'envoi d'un message et à une bonne réponse (V2).
- Heure des messages au format local (« 08:42 », « Hier », « Lun. »).
- Coches de lecture, indicateur « en train d'écrire… » qui dure le temps réel de génération, sans délai artificiel exagéré.
- Clavier qui ne masque jamais le champ de saisie ; défilement qui reste en bas quand un message arrive.
- Sons discrets et désactivables.

Chaque PR d'interface joint des captures clair et sombre ; la liste ci-dessus fait partie de la revue.

## Mention IA obligatoire

Les maquettes ne l'affichent pas encore : chaque contact IA porte un petit badge « IA » à côté de son nom (liste, en-tête de conversation, appel). L'utilisateur doit toujours savoir qu'il parle à une IA. C'est aussi une exigence des stores et une question d'honnêteté.

## Accessibilité

- Contraste du texte ≥ 4,5:1 dans les deux thèmes (vérifié en CI avec axe).
- Tous les boutons-icônes ont un `aria-label`.
- Animations désactivées si `prefers-reduced-motion`.
- Taille de texte respectant le réglage du système (unités `rem`).
