# Sprint 2 — Messagerie avec corrections (E2)

## NS-201 — Liste des discussions (3) · M

_Découpé le 2026-11-18 en deux PR : (1) API `GET /conversations`, (2) écran `/chats` (statuts en constante partagée, décision du jour). « Commencer » du test de niveau renverra vers `/chats`. `/explore` découpé le 2026-11-20 en trois PR : (1) API `GET /topics` et `GET /agents` (faite), (2) API `POST /conversations` (faite), (3) écran `/explore` (fait)._

- [x] Tri par dernier message, badges non lus, rôle en capitales, point « en ligne », filtres Tous / Non lus / Quotidien / Pro / Business / Voyage. _API (PR 1) et écran `/chats` (PR 2) faits._
- [x] Badge « IA » à côté de chaque nom.
- [x] Statuts affichés en lecture seule (contenu fixe par agent au MVP). _Constante `AGENT_STATUSES` dans `packages/shared`. Barre d'onglets du bas faite (affichée sur `/chats` ; les onglets Série, Jeux et Progrès mènent à des routes à venir). `/explore` fait (recherche, thèmes, « Écrire » ; « Appel vidéo » reporté en V3). `/chats/[agentSlug]` : coquille faite (en-tête du contact), l'écran complet est NS-204._

## NS-202 — Passerelle temps réel · L

- [ ] Socket.IO espace `/rt`, authentification par jeton, adaptateur Redis, salles `user:<id>`.
- [ ] Événements de `docs/08-api.md` ; reconnexion automatique et rattrapage des messages manqués.
- [ ] Test : deux réplicas de l'API, un message envoyé sur l'un arrive par l'autre.

## NS-203 — Réponse d'agent et correction · L

_Découpé le 2026-11-21 en quatre PR, sans file ni temps réel d'abord (décision du jour) : (1) gabarit `agent.v1` (fait), (2) API de la réponse et de la correction (faite), (3) écran (fait : « en train d'écrire… » et relecture de l'historique toutes les 2 s pendant 60 s au plus, à retirer avec NS-202), (4) détresse (faite, détection par motifs, sans appel à l'IA), puis modération et évaluations. Le job `agent.reply` sur pg-boss viendra avec NS-016._

- [ ] Job `agent.reply` dans le worker : prompt `agent.v1`, 16 derniers messages, sortie JSON validée par Zod, 2 nouvelles tentatives.
- [ ] Modération en entrée et en sortie ; cas de détresse traité selon `docs/09-ia-agents.md`. _Détresse faite ; garde de sortie par motifs faite (2026-11-20). Reste : modération par modèle, en entrée comme en sortie._
- [x] Idempotence par `clientId` : contrainte unique `(conversationId, clientId)` ; un renvoi rend 200 avec le message déjà enregistré, un nouvel envoi 201.
- [ ] Jeux d'évaluation `corrections.jsonl` (200 cas) et `safety.jsonl` (100 cas) lancés en CI.

## NS-204 — Écran Conversation (4) · L

_Découpé le 2026-11-20 en trois PR : (1) API `GET /conversations/:id/messages`, (2) écran (bulles, historique, pagination), (3) composer et envoi HTTP idempotent, coupée en deux le 2026-11-20 pour tenir sous 400 lignes : API `POST /conversations/:id/messages` (faite), puis composer dans l'écran (le WebSocket de NS-202 le remplacera ; l'agent ne répond qu'avec NS-203)._

- [ ] Bulles, coches, « en train d'écrire… », carte « Plus naturel », suggestions de l'agent, composer avec micro. _Bulles, heures et carte « Plus naturel » faites (PR 2) ; composer fait (PR 3, champ et bouton d'envoi) ; « en train d'écrire… » fait par relecture de l'historique (NS-203, PR 3) en attendant le temps réel ; coches et suggestions attendent NS-202 ; micro : NS-206._
- [x] Pagination par curseur en remontant. _Bouton « Voir les messages précédents » (PR 2)._
- [ ] États : envoi en cours, échec avec « Touche pour réessayer », limite gratuite atteinte. _Envoi en cours et échec faits (PR 3) ; limite gratuite : NS-208._

## NS-209 — Marquer une conversation comme lue · S

_Ajouté le 2026-11-20 : ouvrir une conversation ne remet pas `unreadCount` à zéro, et la route d'historique ne le fait pas (une lecture ne modifie rien)._

- [x] Route `POST /conversations/:id/read` (`unreadCount` à 0, `readAt` des messages du contact) ; tests. _API faite (PR 1)._
- [x] L'écran Conversation l'appelle à l'ouverture et quand une réponse arrive (PR 2).

## NS-205 — Écouter et traduire · M

- [ ] `POST /messages/:id/speech` : TTS avec la voix de l'agent, mis en cache sur Cloudinary.
- [x] `POST /messages/:id/translate` : traduction FR mise en cache. _API et bouton « Traduire » de l'écran Conversation faits le 2026-11-21._

## NS-206 — Dictée · M

- [ ] Enregistrement dans le navigateur (WebM/Opus), téléversement signé vers Cloudinary, transcription, texte inséré dans le champ.
- [ ] Repli si le micro est refusé : le bouton disparaît, l'écriture reste possible.

## NS-207 — Carnet · S

_Découpé le 2026-11-20 en trois PR : (1) API `POST` et `GET /notebook` (faite), (2) bouton « Ajouter au carnet » sur la carte « Plus naturel » (fait), (3) liste dans le profil (faite)._

- [x] « Ajouter au carnet » depuis une correction ; liste dans le profil. _Bouton sur la carte (PR 2) et section « Mon carnet » dans le profil (PR 3)._

## NS-208 — Limites d'usage · M

- [ ] Compteurs Redis par jour et par clé ; consolidation dans `UsageCounter` ; événement `quota.update`.

## NS-016 — File de jobs pg-boss (phase 1, sur Neon) · S

_Déplacé du sprint 0 le 2026-11-15 : il sert ici, pas avant._
Les réponses d'agent, la voix et les e-mails passent par la file (NS-203, NS-205, NS-206).

- [ ] Adaptateur `PgBossQueue` derrière le port `Queue` (`modules/jobs/domain/queue.ts`), avec son test unitaire ; la file en mémoire reste l'adaptateur des tests et du local.
- [ ] Intervalle d'interrogation de 30 s ou plus, pour laisser Neon s'endormir (risque décrit dans `docs/decisions.md`) ; mesurer les CU-heures consommées et alerter le porteur au-delà de 80.
- [ ] La file vit dans un paquet partagé, pour que l'API (`RUN_JOBS=inline`) et le worker l'utilisent.
- Dépend de NS-002 et d'une base Neon (NS-008).

## NS-210 — Ressources d'aide par pays · S

_Ajouté le 2026-11-20 : le message de détresse ne cite que le 3114 (France) et findahelpline.com ; aucun autre numéro n'est inventé._

- [ ] Liste des lignes d'aide par pays, choisie selon le pays de la personne, relue par le porteur du projet.

## NS-211 — Pages provisoires des onglets · S

_Ajouté le 2026-11-20 : les onglets Série, Jeux et Progrès de la barre du bas menaient à une page introuvable (404)._

- [x] Écran « Bientôt » sur `/series`, `/games` et `/progress`, avec la barre d'onglets et un retour vers les discussions ; tests. Chaque page sera remplacée par son vrai écran (NS-402, NS-301 et suivants, progrès).

## NS-036 — Discussions : en-têtes alignés et filtres sur trois choix · S

_Ajouté le 2026-11-24 par le porteur du projet, en regardant l'aperçu de NS-034._

- [ ] Sur ordinateur, le logo du rail, le titre « Discussions », le bouton « + » et l'en-tête de la conversation sont sur la même ligne, à la même hauteur. Le logo est plus grand.
- [ ] La rangée de filtres montre trois choix (Toutes, Non lues, Quotidien) et un bouton « Plus » qui ouvre la liste des autres (Pro, Business, Voyage). Le filtre choisi dans la liste reste visible dans la rangée.
- [ ] Tests unitaires, thèmes clair et sombre.

## NS-037 — Rechercher dans les messages · M

_Ajouté le 2026-11-24 : les appels ne sont pas encore là, mais la recherche de messages doit l'être (maquette : loupe dans l'en-tête de la conversation)._
_Décidé le 2026-11-24 : la recherche porte sur toutes les discussions (option B)._

- [x] Route API de recherche, limitée aux messages de la personne connectée, documentée dans `docs/08-api.md`, avec un index adapté. Aucun contenu de message dans les logs.
- [x] Un champ de recherche depuis la liste des discussions ; chaque résultat montre le contact, l'extrait avec le mot surligné et la date. Un toucher ouvre la conversation au bon message (l'écran remonte l'historique page par page, 20 pages au plus ; pas de paramètre `around` côté API).
- [x] Tests unitaires (service, route, écran), thèmes clair et sombre.

## NS-038 — Fonds de conversation au choix · M

_Ajouté le 2026-11-24 : plusieurs motifs de fond, comme WhatsApp, pour rendre la conversation plus attirante._

- [ ] Dix fonds (liste dans `docs/decisions.md`) qui respectent les thèmes clair et sombre et gardent les contrastes 4,5:1 sur les bulles.
      _Décidé le 2026-11-24 : le choix est gardé sur le compte (option B)._
- [ ] Migration additive : un champ `chatBackground` sur `User`, avec une valeur par défaut. Route `PATCH` du profil mise à jour et documentée dans `docs/08-api.md`.
- [ ] Le choix se fait depuis le menu « ⋮ » de l'en-tête de la conversation (maquette), et aussi au Profil ; il s'applique à toutes les conversations.
- [ ] Le « ⋮ » est un vrai bouton (cible ≥ 44 px, menu au clavier) : il ouvre au minimum « Fond de la conversation ».
- [ ] Le motif est décoratif, sans aucun texte dans l'image ; tests unitaires.

## NS-039 — Messagerie responsive et barre d'écriture façon WhatsApp · M

_Ajouté le 2026-11-25 par le porteur du projet, en testant l'application : elle n'est pas 100 % responsive et l'écran de conversation déborde quand on écrit._

- [x] Plus aucun débordement horizontal dans la conversation (mots longs, clavier ouvert, petits écrans 320 px, tablette, ordinateur).
- [x] Barre d'écriture plus douce, style WhatsApp : champ arrondi qui grandit avec le texte, Entrée envoie, Maj+Entrée passe à la ligne, bouton d'envoi rond.
- [x] Tests unitaires, thèmes clair et sombre, cibles ≥ 44 px.

## NS-040 — Responsive des autres écrans · M

_Ajouté le 2026-11-25 : le porteur du projet constate que l'application n'est pas 100 % responsive._

- [ ] Passer en revue Discussions, Profil, Notifications, connexion et inscription à 320, 375, 768 et 1280 px, sans débordement horizontal.
- [ ] Tests unitaires pour chaque correction, thèmes clair et sombre.

## NS-041 — Écran de démarrage animé · S

_Ajouté le 2026-11-25 par le porteur du projet, avec la maquette `ecran-demarrage` (numérotée NS-015 dans son fichier, numéro déjà pris par les générateurs)._

- [ ] Première ouverture : « La correction » (2,7 s) ; ouvertures suivantes : « La bulle s'ouvre » (1,3 s). Une fois par ouverture de l'appli.
- [ ] Un toucher, Entrée ou Échap saute l'animation ; `prefers-reduced-motion` : icône et mot pendant 0,4 s.
- [ ] Durées dans `features/splash/timeline.ts` ; tests unitaires et test e2e (durée maximale, enchaînement).
- [ ] Réduction à 0,8 s « si les données sont prêtes » : non faite, aucun signal de chargement n'existe encore.

## NS-042 — La liste des discussions reste en place quand on fait défiler une conversation · S

_Ajouté le 2026-11-25 par le porteur du projet : l'onglet des discussions bouge quand il parcourt les messages._

- [ ] Dès 1024 px, la liste reste fixe à gauche pendant que les messages défilent ; elle défile seule si elle est plus haute que l'écran.
- [ ] Test unitaire de la mise en page.

## NS-043 — L'écran de démarrage vient à chaque ouverture · S

_Ajouté le 2026-11-25 par le porteur du projet : l'écran est trop rapide à voir, il doit venir comme sur Instagram ou WhatsApp._

- [x] Il joue à chaque chargement ou rechargement de la page, et au retour dans l'appli après 5 minutes ou plus en arrière-plan. Mêmes durées qu'aujourd'hui.
- [x] Mettre à jour `docs/17-ecran-demarrage.md` ; tests unitaires et e2e.

## NS-044 — Cloche des notifications dans l'en-tête · S

_Ajouté le 2026-11-25 : l'icône flotte en haut à droite, sur le web comme sur mobile._

- [x] Mobile : cloche dans l'en-tête de chaque écran, alignée avec le titre. Ordinateur : entrée de la barre latérale. Point de non-lu conservé.
- [x] Plus de cloche flottante ; tests unitaires, thèmes clair et sombre, cible ≥ 44 px.

## NS-045 — Profil organisé en sous-pages · L

_Ajouté le 2026-11-25 : la page Profil est « brute », tout y est regroupé. Référence : WhatsApp._

- [x] En-tête (avatar, nom, niveau), puis lignes qui ouvrent chacune une page : Apprentissage, Notifications et rappels, Apparence et conversations, Mon carnet, Données et compte (`/profile/<rubrique>`).
- [x] Rien ne disparaît : tous les réglages actuels se retrouvent. À découper en deux ou trois PR.
- [ ] Les nouveaux réglages seront proposés dans des tickets à part. Maquette d'abord, tests unitaires, deux thèmes.

## NS-046 — Barre d'écriture : +, micro et envoi · M

_Ajouté le 2026-11-25 : tout dans un seul endroit, comme WhatsApp. Suite de NS-039._

- [x] Champ arrondi, bouton + (photo, fichier), micro quand le champ est vide, envoi quand il y a du texte.
- [x] Enregistrement vocal avec durée affichée, annulation et aperçu avant envoi ; choix de fichier avec aperçu. L'envoi réel reste à faire (NS-047) : en attendant, la barre le dit.
- [x] Tests unitaires, deux thèmes, accessibilité (libellés, cibles ≥ 44 px).

## NS-047 — Envoi réel des vocaux et des pièces jointes · L

_Ajouté le 2026-11-25. Dépend de NS-046 et d'une décision sur le stockage de fichiers (dépense)._

- [ ] Stockage, taille et types limités, URL signées, suppression avec le compte. Piste proposée par le porteur du projet : Cloudinary (images et audio). Comparer avec un bucket compatible S3, vérifier les tarifs, puis demander.
- [ ] Lecture des vocaux et affichage des images dans la conversation.
- [ ] Ce que les contacts IA font d'un vocal (transcription, prononciation) : à décider avant.

## NS-048 — Se déconnecter · S

_Ajouté le 2026-11-25 : aucun bouton de déconnexion dans le Profil._

- [x] Bouton « Se déconnecter » en bas de l'accueil du profil : ferme la session (cookie effacé par `/auth/logout`) et renvoie à l'accueil. Sans confirmation, on se reconnecte avec un code.
- [x] Tests unitaires (API et écran).

## NS-049 — Plusieurs avatars au choix · M

_Ajouté le 2026-11-25 à la demande du porteur du projet (« comme Synapse »). Remplacé le jour même par NS-062, NS-063 et NS-064 (maquettes et SVG fournis par le porteur, `docs/18-avatars.md`). Rien à coder ici._

## NS-050 — Modifier son profil · M

_Ajouté le 2026-11-25._

- [x] Partie 1 : rubrique « Mon compte » (Profil) : prénom, année de naissance (13 ans minimum), centres d'intérêt. `GET /me` renvoie `birthYear` et `interests`, `PATCH /me` les accepte.
- [ ] Partie 2 : numéro et e-mail, avec un nouveau code de confirmation (le numéro passe par un SMS : coût du fournisseur à confirmer avec le porteur).
- [ ] Partie 3 : photo ou avatar, avec NS-049.
- [x] Schémas Zod partagés, tests unitaires, deux thèmes.

## NS-051 — Profil d'un contact et variantes · L

_Ajouté le 2026-11-25._

- [x] Partie 1 (#337) : fiche d'un contact depuis l'en-tête de la conversation (avatar, nom, rôle, accent, thème, accès au choix d'avatar).
- [x] Partie 2 (#339) : présentation, centres d'intérêt et niveau de langue, textes écrits à la main dans le catalogue.
- [x] Partie 3a (#341) : ton et difficulté par contact, côté API (table `ContactVariant`, routes `/me/contact-variants`, injection dans le prompt).
- [x] Partie 3b : carte « Réglages pour toi » sur la fiche (ton, difficulté, avatar, retour aux réglages d'origine).
- [ ] Accent par contact (en pause, décision du 2026-11-25) : demande une voix de plus par accent. Pistes : le porteur fournit un fournisseur, ou recherche de voix open source, ou variantes générées sur Google Colab. Rien à coder tant que ce n'est pas choisi. Cadre dans `docs/09-ia-agents.md` : un agent ne se présente jamais comme un humain.

## NS-052 — La traduction ne doit jamais montrer une réponse factice · S

_Ajouté le 2026-11-25 : « Traduire en français » ne marche pas._

- [x] Cause : quand le fournisseur d'IA est absent, hors quota ou en panne, l'adaptateur factice répond « Got it: … ». Il passait pour une traduction.
- [x] Les réponses factices sont marquées ; la traduction les refuse (503 `AI_UNAVAILABLE`, rien n'est gardé) et le bouton propose de réessayer.
- [x] Tests unitaires (adaptateur factice, service de traduction).
- [ ] Vérifier sur staging que `LLM_PROVIDER` et la clé correspondent (à faire avec le porteur : valeurs secrètes).

## NS-053 — Mobile : garder des messages visibles quand le clavier s'ouvre · M

- [x] À l'ouverture du clavier, la liste redescend en bas : les derniers messages restent visibles au-dessus de la barre d'écriture.
- [x] Test unitaire.

## NS-054 — Actions sur un message : supprimer, modifier, transférer, copier, répondre · L

- [x] Menu « … » sur chaque bulle : copier, supprimer (avec confirmation). Décision du 2026-11-25 : la suppression efface le texte et la bulle devient « Message supprimé ».
- [x] Répondre en citant (#344 API, web) : « Répondre » dans le menu, bande au-dessus du champ, citation dans la bulle.
- [x] Modifier (#346 API, web) : « Modifier » dans le menu de ses messages, le champ reprend le texte, mention « modifié », correction relue.
- [x] Transférer (mention « transféré ») : API (#348) et web.
- [x] Réactions : API (#350) et web (`PUT /messages/:id/reaction`).
- [x] API de suppression (`DELETE /messages/:id`, colonne `deletedAt`). Reste : modification et transfert.
- [ ] À découper en deux ou trois PR.

## NS-055 — Émojis et stickers · M

- [x] Sélecteur d'émojis dans la barre d'écriture (une quarantaine, sans bibliothèque).
- [x] Réactions rapides sur un message (voir NS-054).
- [x] Stickers : source décidée (63 stickers maison, voir `docs/decisions.md`), API faite.
- [x] Stickers : panneau (recherche, 5 groupes), envoi et affichage dans la bulle, côté web.

## NS-057 — Responsivité tablette (768 et 1024 px) · M
**Besoin** : de 640 à 1023 px, l'appli affiche la version mobile étirée ; aucun seuil `md` n'existe.
**Critères d'acceptation**
- [x] Chaque écran est contrôlé à 768 et 1024 px, en clair et en sombre.
- [x] Aucun débordement horizontal, cibles tactiles ≥ 44 px, lignes de texte lisibles (largeur bornée).
- [x] Aucun écart bloquant : colonne de contenu bornée à ~400 px dès 768 px, rail latéral et deux colonnes dès 1024 px. Contrôle de débordement à 768 px déjà couvert par `e2e/responsive.spec.ts`.

## NS-067 — Ordinateur : ouvrir une fenêtre ne décale plus la page · S

_Ajouté le 2026-11-26, défaut vu en travaillant sur NS-066._

- [x] Dès 1024 px, ouvrir une fenêtre ou un menu garde la page à droite du rail (72 px). Cause : le blocage du défilement de Radix remettait la marge à 0.
- [x] Test e2e, deux thèmes. Pas de test unitaire : une seule règle CSS, vérifiable dans un navigateur.

## NS-058 — Domaines élargis et contacts IA selon les centres d'intérêt · L
**Besoin** : le catalogue ne couvre pas les 16 centres d'intérêt de l'inscription.
- [x] Partie 1 : 8 thèmes et 11 contacts ajoutés (17 thèmes, 23 contacts), statuts et tests à jour.
- [x] Partie 2 : section « Pour toi » dans Explorer, selon `interests` et `goals` du compte.
- [x] Partie 3 : `agent-reply` transmet les centres d'intérêt au contact (aujourd'hui seulement `goal`).

## NS-059 — Barre d'écriture façon WhatsApp, avec stickers et GIF · L
**Besoin** (porteur, 2026-11-25, captures WhatsApp et New Start sur iPhone) : adapter la barre d'écriture à celle de WhatsApp, sur mobile et sur ordinateur.
- [ ] Maquette d'abord (clair et sombre) : champ en pilule, bouton « + » à gauche, micro à droite qui devient « envoyer » quand il y a du texte. À valider avant le code.
- [x] Un seul bouton « émojis et stickers » (GIF plus tard) ; sur téléphone il ne montre que les stickers.
- [x] Mobile : panneau à la place du clavier, stickers seulement (GIF à venir) ; les émojis viennent du clavier. (#354, #355)
- [x] Ordinateur : même panneau, onglets émojis et stickers (GIF à venir).
- [ ] Le panneau garde les récents et un champ de recherche ; fermeture au toucher en dehors ou avec Échap ; focus géré au clavier.
- [ ] Source des stickers et des GIF à choisir avec le porteur (options, licence, coût) avant de coder. Aucune dépense sans accord.
- [ ] Tests unitaires du panneau, de la bascule clavier/panneau et des onglets ; e2e sur mobile et sur ordinateur.

## NS-060 — Masquer la barre de suggestions au-dessus du clavier iPhone · S
**Besoin** : au-dessus du champ de saisie, iOS affiche sa barre (flèches haut/bas, validation, mots proposés) qui gêne.
- [ ] Vérifier sur iPhone ce que le navigateur permet : `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`, champ hors de tout `<form>`, `enterkeyhint`.
- [ ] Appliquer ce qui marche. La barre système elle-même n'est pas contrôlable par une page web : si elle reste, le dire au porteur avec ce qui l'explique (réglages du clavier, version iOS).
- [ ] Attention : couper la correction automatique a un coût pour une personne qui apprend. Proposer le choix au porteur avant de la désactiver.
- [ ] Test unitaire sur les attributs du champ.

## NS-061 — Les contacts envoient stickers, GIF et vrais médias · L
**Besoin** : les contacts IA peuvent répondre avec un sticker, un émoji ou un GIF, et aussi donner de vrais contenus : images, liens, documents, médias.
- [ ] Dépend de NS-047 (stockage des pièces jointes, choix et coût à décider) et de NS-059 (source des stickers et GIF).
- [ ] Les contacts piochent dans la bibliothèque de stickers et de GIF : le prompt ne propose que des identifiants existants, jamais une URL inventée.
- [ ] Liens : seulement des sources fiables ; images et documents vérifiés, jamais générés au hasard. Pas de contenu sexuel ni violent (règle de `docs/09-ia-agents.md`).
- [ ] Affichage dans la conversation : aperçu de lien, image ouvrable, document téléchargeable.
- [ ] Tests unitaires (choix d'un sticker valide, rejet d'un identifiant inconnu, rendu des types de message).

## NS-062 — Silhouettes neutres · M

_Ajouté le 2026-11-25. Source : `docs/18-avatars.md`, maquettes dans `design/avatars/`. Style par défaut décidé le 2026-11-25 : `duo` pour les contacts, `gris` pour les personnes, forme `carre`._

- [x] Porter `design/avatars/avatars.js` et `bibliotheque.js` en TypeScript dans `packages/ui/src/avatars` (360 silhouettes, 16 palettes), sans changer les tracés ni les couleurs (rendu comparé au SVG d'origine, seul le cercle invisible de rayon 0 de l'anneau carré a disparu). Partie 1.
- [x] Composant `NeutralAvatar` (identifiant, variante, forme, thème, palette) : SVG dans un `<img>` en URI de données (pas de HTML injecté, pas d'identifiant `clipPath` à rendre unique), `alt` = nom. Partie 1.
- [ ] Repli du composant Avatar de shadcn/ui : jamais de carré vide quand une photo ne se charge pas.
- [x] Partie 2 (API) : `User.avatar` (JSON facultatif, migration additive), `GET /me` et `PATCH /me` le portent (`AvatarChoice` dans `packages/shared`, `null` pour le retirer).
- [x] Partie 3a (#330) : écran de choix (silhouette, palette, style) dans Mon compte, avatar sur l’accueil du profil.
- [x] Partie 3b : avatar des contacts dans les listes, la conversation, la recherche et Explorer (silhouette propre aux 12 contacts, sinon une de la bibliothèque, toujours la même pour un contact).
- [ ] Repli du composant Avatar de shadcn/ui (plus utilisé dans l’appli, à retirer ou garder pour les photos).
- [ ] Partie 4 : choix par contact (table dédiée) et silhouettes des 11 contacts NS-058.
- [x] Avatar par défaut à l’inscription : aucun choix enregistré = silhouette grise (rien à ajouter).
- [x] Style et forme réglables par variables d’environnement (`NEXT_PUBLIC_AVATAR_CONTACT_STYLE`, `NEXT_PUBLIC_AVATAR_SHAPE`), option A.
- [x] Les 11 contacts de NS-058 ont leur silhouette sur mesure, composée avec les pièces de la bibliothèque (planche validée par le porteur le 2026-11-25).
- [ ] Tests unitaires, tests visuels clair et sombre, accessibilité.

## NS-063 — Éditeur d'avatar et stickers · L

_Ajouté le 2026-11-25. Après NS-062, et lié à NS-059 (stickers)._

- [ ] Éditeur « Crée ton avatar » avec DiceBear `avataaars` côté client, choix enregistrés en petit JSON.
- [ ] 8 stickers en anglais (Thanks!, Got it!, Well done!, Hmm…, Oops!, Sorry!, No way!, See you!) envoyables ; les agents les comprennent et y répondent.
- [ ] Licence d'`avataaars` à reconfirmer avant l'intégration (« libre pour usage personnel et commercial »).

## NS-064 — Portraits illustrés des contacts IA · M

_Ajouté le 2026-11-25. Contenu ; générer les images coûte des crédits : accord du porteur d'abord._

- [ ] 8 portraits restants plus la correction du teint du Prof. Adeyemi, puis remplacement des silhouettes des contacts.
- [ ] Les 11 contacts de NS-058 s'ajoutent à la liste.

## NS-065 — Bibliothèque de centaines d'avatars · M

_Ajouté le 2026-11-25 à la demande du porteur du projet : les zip sont des exemples, il faut les multiplier dans le même style._

- [ ] Étendre le générateur `design/avatars/avatars.js` avec de nouvelles pièces (coiffures, couvre-chefs, barbes, lunettes, tenues) dans le même trait monochrome, sans changer les tracés existants.
- [ ] `design/avatars/bibliotheque.js` : au moins 300 silhouettes distinctes et 16 palettes, générées de façon déterministe (un identifiant suffit à les retrouver), avec les 7 variantes, 2 formes et 2 thèmes.
- [ ] Planche de contact en HTML (`design/avatars/maquette-bibliotheque.html`), clair et sombre, validée par le porteur avant tout code dans l'appli.
- [ ] Ensuite (NS-062) : chaque contact garde sa silhouette d'origine et la personne peut en choisir une autre dans la bibliothèque pour ce contact, et pour elle-même.

