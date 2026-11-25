# 18 — Avatars

Trois familles d'avatars, toutes au service du concept : une messagerie où l'on parle anglais avec des contacts IA. Fichiers dans `design/avatars/`.

| Famille | Pour qui | Statut |
| --- | --- | --- |
| Silhouettes neutres | Utilisateurs sans photo, groupes, contacts IA | Validé par le porteur du projet ; style par défaut à confirmer (voir plus bas) |
| Avatar personnalisé | L'utilisateur qui crée le sien | Proposé, à faire après les silhouettes |
| Portraits illustrés | Les 12 contacts IA | 4 essais faits, 8 à produire ; remplaceront plus tard les silhouettes des contacts |

Maquettes à ouvrir dans le navigateur :

- `design/avatars/maquette-avatars-neutres.html` (en ligne : <https://claude.ai/artifact/2uueNjh5EueknUiiKTAPQT>)
- `design/avatars/maquette-avatar-utilisateur.html` (en ligne : <https://claude.ai/artifact/LdSF4X8i8ZsNb8vcBekzdB>)

## 1. Silhouettes neutres, comme sur WhatsApp

### Utilisateurs et groupes

- **Personne** : silhouette tête et épaules, grise. Avatar par défaut de tout utilisateur sans photo ni avatar.
- **Groupe** (V2) : deux silhouettes.
- **Initiales** : variante possible, deux lettres sur fond gris.
- **Profil** : grande silhouette avec un bouton rond vert (appareil photo) et le bouton « Créer mon avatar ».
- Fichiers : `svg/rond/avatar-neutre-personne-{light,dark}.svg`, `svg/rond/avatar-neutre-groupe-{light,dark}.svg`.

### Contacts IA : une silhouette à détail

Chaque contact a sa silhouette, avec un détail qui le fait reconnaître :

| Contact | Détail |
| --- | --- |
| Jade | Chignon |
| Sam | Tablier de barista |
| Leo | Mèche |
| Mrs. Carter | Cheveux bouclés, lunettes, collier de perles |
| Emma Lin | Queue-de-cheval, casque |
| Daniel Ross | Cravate |
| Officer Grant | Casquette d'uniforme |
| Maya Reed | Cheveux longs |
| Kofi Owusu | Cheveux courts frisés, barbe |
| Marcus | Maillot |
| Nina Shah | Carré, micro |
| Prof. Adeyemi | Lunettes, barbe |

Les contacts IA gardent **toujours** le badge « IA » à côté de leur nom, quelle que soit la variante.

### Sept variantes, deux formes, deux thèmes

| Variante (`id`) | Rendu |
| --- | --- |
| `gris` | Gris neutre, l'esprit WhatsApp |
| `theme` | Teinte douce de la catégorie (Quotidien bleu, Pro violet, Business sable, Voyage vert d'eau, Amour rose, Sport vert, Actualité or, Études taupe) |
| `duo` | Deux tons : silhouette dans la teinte de la catégorie, cheveux et barbe plus foncés |
| `anneau` | Gris neutre entouré d'un anneau à la couleur de la catégorie |
| `noir` | Noir premium : fond noir, silhouette grise, cheveux en vert #CCFF00 |
| `vert` | Vert New Start : silhouette noire sur fond #CCFF00 |
| `initiales` | Initiales sur la teinte de la catégorie |

Formes : `rond` ou `carre` (carré arrondi, rayon 26 %). Thèmes : `light` et `dark`.

Fichiers prêts : `design/avatars/svg/{rond,carre}/<slug>-<variante>-<light|dark>.svg` (12 contacts × 7 variantes × 2 thèmes, pour chaque forme).

### Choix par défaut : à confirmer avec le porteur du projet

Recommandation à lui présenter (règle 10 de `CLAUDE.md`) :

- **Contacts IA** : `duo`, forme `rond`.
- **Utilisateurs sans avatar** : silhouette `gris`, forme `rond`.

Le style doit rester **réglable sans redéploiement** (configuration `avatars.contactStyle` et `avatars.shape`), pour pouvoir changer d'avis plus tard.

### Mise en œuvre

- Le générateur de référence est `design/avatars/avatars.js` : formes SVG, couleurs, variantes. Le porter en TypeScript dans `packages/ui` (`neutral-avatar.ts`), sans changer les tracés ni les couleurs.
- Composant `<NeutralAvatar contact={slug} variant shape size />` qui produit le SVG en ligne, avec un `clipPath` à identifiant unique (`useId`). Le thème clair ou sombre suit celui de l'appli.
- Utilisé comme **repli** du composant Avatar de shadcn/ui : si le portrait ou la photo ne se charge pas (réseau lent, économie de données), la silhouette s'affiche, jamais un carré vide.
- Le champ `Agent.avatarStyle` n'est pas nécessaire : le slug suffit pour retrouver la silhouette.
- Accessibilité : `role="img"` et `aria-label` avec le nom du contact ; le badge « IA » reste du texte.

## 2. Avatar personnalisé de l'utilisateur (style Bitmoji)

- Éditeur « Crée ton avatar » : peau, coiffure (dont foulard, turban, afro, dreadlocks, tresses), couleur des cheveux, foulard ou bonnet, barbe, lunettes, tenue ; bouton « Au hasard ». Pour tout le monde, sans orientation régionale par défaut.
- Bibliothèque **DiceBear**, style `avataaars` (libre d'usage commercial), générée côté client.
- Enregistré en base comme une petite liste de choix (JSON de quelques octets), pas comme une image.
- **Stickers en anglais** : le même avatar en 8 expressions (Thanks!, Got it!, Well done!, Hmm…, Oops!, Sorry!, No way!, See you!), envoyables dans les discussions ; les agents les comprennent et y répondent.
- V2 : l'avatar de l'utilisateur apparaît dans les scènes de la série, à côté des personnages.

## 3. Portraits illustrés des contacts IA

- Style 3D doux, buste, fond gris clair, tenue du métier. Essais : `design/avatars/portraits-essai/` (Jade, Emma Lin, Officer Grant, Prof. Adeyemi). Le teint du Prof. Adeyemi est à refaire, plus foncé.
- Consigne commune pour les 8 autres : « Stylized 3D cartoon avatar portrait for a messaging app, head and shoulders, centered, facing the viewer, smooth matte clay-like shading, soft studio lighting, clean rounded shapes, expressive eyes, plain solid light grey background, no text, no logo. Character: … » (descriptions des personnages dans la maquette utilisateur).
- Générer ces images coûte des crédits : à faire seulement avec l'accord du porteur du projet. En attendant, les silhouettes à détail servent de portraits.

## Tickets

- **NS-062 — Silhouettes neutres** (sprint 2) : composant `NeutralAvatar`, 7 variantes, 2 formes, 2 thèmes ; repli du composant Avatar ; avatar par défaut à l'inscription ; écran profil avec bouton photo. Tests visuels Storybook (clair et sombre) et test d'accessibilité.
- **NS-063 — Éditeur d'avatar et stickers** (après le sprint 2) : éditeur DiceBear, enregistrement des choix, 8 stickers envoyables, réponse des agents aux stickers.
- **NS-064 — Portraits des contacts IA** (contenu) : 8 portraits restants et correction du Prof. Adeyemi, sur accord budgétaire ; remplacement des silhouettes des contacts.
