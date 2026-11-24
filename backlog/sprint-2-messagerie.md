# Sprint 2 — Messagerie avec corrections (E2)

## NS-201 — Liste des discussions (3) · M
*Découpé le 2026-11-18 en deux PR : (1) API `GET /conversations`, (2) écran `/chats` (statuts en constante partagée, décision du jour). « Commencer » du test de niveau renverra vers `/chats`. `/explore` découpé le 2026-11-20 en trois PR : (1) API `GET /topics` et `GET /agents` (faite), (2) API `POST /conversations` (faite), (3) écran `/explore` (fait).*
- [x] Tri par dernier message, badges non lus, rôle en capitales, point « en ligne », filtres Tous / Non lus / Quotidien / Pro / Business / Voyage. *API (PR 1) et écran `/chats` (PR 2) faits.*
- [x] Badge « IA » à côté de chaque nom.
- [x] Statuts affichés en lecture seule (contenu fixe par agent au MVP). *Constante `AGENT_STATUSES` dans `packages/shared`. Barre d'onglets du bas faite (affichée sur `/chats` ; les onglets Série, Jeux et Progrès mènent à des routes à venir). `/explore` fait (recherche, thèmes, « Écrire » ; « Appel vidéo » reporté en V3). `/chats/[agentSlug]` : coquille faite (en-tête du contact), l'écran complet est NS-204.*

## NS-202 — Passerelle temps réel · L
- [ ] Socket.IO espace `/rt`, authentification par jeton, adaptateur Redis, salles `user:<id>`.
- [ ] Événements de `docs/08-api.md` ; reconnexion automatique et rattrapage des messages manqués.
- [ ] Test : deux réplicas de l'API, un message envoyé sur l'un arrive par l'autre.

## NS-203 — Réponse d'agent et correction · L
*Découpé le 2026-11-21 en quatre PR, sans file ni temps réel d'abord (décision du jour) : (1) gabarit `agent.v1` (fait), (2) API de la réponse et de la correction (faite), (3) écran (fait : « en train d'écrire… » et relecture de l'historique toutes les 2 s pendant 60 s au plus, à retirer avec NS-202), (4) détresse (faite, détection par motifs, sans appel à l'IA), puis modération et évaluations. Le job `agent.reply` sur pg-boss viendra avec NS-016.*
- [ ] Job `agent.reply` dans le worker : prompt `agent.v1`, 16 derniers messages, sortie JSON validée par Zod, 2 nouvelles tentatives.
- [ ] Modération en entrée et en sortie ; cas de détresse traité selon `docs/09-ia-agents.md`. *Détresse faite ; garde de sortie par motifs faite (2026-11-20). Reste : modération par modèle, en entrée comme en sortie.*
- [x] Idempotence par `clientId` : contrainte unique `(conversationId, clientId)` ; un renvoi rend 200 avec le message déjà enregistré, un nouvel envoi 201.
- [ ] Jeux d'évaluation `corrections.jsonl` (200 cas) et `safety.jsonl` (100 cas) lancés en CI.

## NS-204 — Écran Conversation (4) · L
*Découpé le 2026-11-20 en trois PR : (1) API `GET /conversations/:id/messages`, (2) écran (bulles, historique, pagination), (3) composer et envoi HTTP idempotent, coupée en deux le 2026-11-20 pour tenir sous 400 lignes : API `POST /conversations/:id/messages` (faite), puis composer dans l'écran (le WebSocket de NS-202 le remplacera ; l'agent ne répond qu'avec NS-203).*
- [ ] Bulles, coches, « en train d'écrire… », carte « Plus naturel », suggestions de l'agent, composer avec micro. *Bulles, heures et carte « Plus naturel » faites (PR 2) ; composer fait (PR 3, champ et bouton d'envoi) ; « en train d'écrire… » fait par relecture de l'historique (NS-203, PR 3) en attendant le temps réel ; coches et suggestions attendent NS-202 ; micro : NS-206.*
- [x] Pagination par curseur en remontant. *Bouton « Voir les messages précédents » (PR 2).*
- [ ] États : envoi en cours, échec avec « Touche pour réessayer », limite gratuite atteinte. *Envoi en cours et échec faits (PR 3) ; limite gratuite : NS-208.*

## NS-209 — Marquer une conversation comme lue · S
*Ajouté le 2026-11-20 : ouvrir une conversation ne remet pas `unreadCount` à zéro, et la route d'historique ne le fait pas (une lecture ne modifie rien).*
- [x] Route `POST /conversations/:id/read` (`unreadCount` à 0, `readAt` des messages du contact) ; tests. *API faite (PR 1).*
- [x] L'écran Conversation l'appelle à l'ouverture et quand une réponse arrive (PR 2).

## NS-205 — Écouter et traduire · M
- [ ] `POST /messages/:id/speech` : TTS avec la voix de l'agent, mis en cache sur Cloudinary.
- [x] `POST /messages/:id/translate` : traduction FR mise en cache. *API et bouton « Traduire » de l'écran Conversation faits le 2026-11-21.*

## NS-206 — Dictée · M
- [ ] Enregistrement dans le navigateur (WebM/Opus), téléversement signé vers Cloudinary, transcription, texte inséré dans le champ.
- [ ] Repli si le micro est refusé : le bouton disparaît, l'écriture reste possible.

## NS-207 — Carnet · S
*Découpé le 2026-11-20 en trois PR : (1) API `POST` et `GET /notebook` (faite), (2) bouton « Ajouter au carnet » sur la carte « Plus naturel » (fait), (3) liste dans le profil (faite).*
- [x] « Ajouter au carnet » depuis une correction ; liste dans le profil. *Bouton sur la carte (PR 2) et section « Mon carnet » dans le profil (PR 3).*

## NS-208 — Limites d'usage · M
- [ ] Compteurs Redis par jour et par clé ; consolidation dans `UsageCounter` ; événement `quota.update`.

## NS-016 — File de jobs pg-boss (phase 1, sur Neon) · S
*Déplacé du sprint 0 le 2026-11-15 : il sert ici, pas avant.*
Les réponses d'agent, la voix et les e-mails passent par la file (NS-203, NS-205, NS-206).
- [ ] Adaptateur `PgBossQueue` derrière le port `Queue` (`modules/jobs/domain/queue.ts`), avec son test unitaire ; la file en mémoire reste l'adaptateur des tests et du local.
- [ ] Intervalle d'interrogation de 30 s ou plus, pour laisser Neon s'endormir (risque décrit dans `docs/decisions.md`) ; mesurer les CU-heures consommées et alerter le porteur au-delà de 80.
- [ ] La file vit dans un paquet partagé, pour que l'API (`RUN_JOBS=inline`) et le worker l'utilisent.
- Dépend de NS-002 et d'une base Neon (NS-008).

## NS-210 — Ressources d'aide par pays · S
*Ajouté le 2026-11-20 : le message de détresse ne cite que le 3114 (France) et findahelpline.com ; aucun autre numéro n'est inventé.*
- [ ] Liste des lignes d'aide par pays, choisie selon le pays de la personne, relue par le porteur du projet.

## NS-211 — Pages provisoires des onglets · S
*Ajouté le 2026-11-20 : les onglets Série, Jeux et Progrès de la barre du bas menaient à une page introuvable (404).*
- [x] Écran « Bientôt » sur `/series`, `/games` et `/progress`, avec la barre d'onglets et un retour vers les discussions ; tests. Chaque page sera remplacée par son vrai écran (NS-402, NS-301 et suivants, progrès).

## NS-036 — Discussions : en-têtes alignés et filtres sur trois choix · S
*Ajouté le 2026-11-24 par le porteur du projet, en regardant l'aperçu de NS-034.*
- [ ] Sur ordinateur, le logo du rail, le titre « Discussions », le bouton « + » et l'en-tête de la conversation sont sur la même ligne, à la même hauteur. Le logo est plus grand.
- [ ] La rangée de filtres montre trois choix (Toutes, Non lues, Quotidien) et un bouton « Plus » qui ouvre la liste des autres (Pro, Business, Voyage). Le filtre choisi dans la liste reste visible dans la rangée.
- [ ] Tests unitaires, thèmes clair et sombre.

## NS-037 — Rechercher dans les messages · M
*Ajouté le 2026-11-24 : les appels ne sont pas encore là, mais la recherche de messages doit l'être (maquette : loupe dans l'en-tête de la conversation).*
*Décidé le 2026-11-24 : la recherche porte sur toutes les discussions (option B).*
- [ ] Route API de recherche, limitée aux messages de la personne connectée, documentée dans `docs/08-api.md`, avec un index adapté. Aucun contenu de message dans les logs.
- [ ] Un champ de recherche depuis la liste des discussions ; chaque résultat montre le contact, l'extrait avec le mot surligné et la date. Un toucher ouvre la conversation au bon message.
- [ ] Tests unitaires (service, route, écran), thèmes clair et sombre.

## NS-038 — Fonds de conversation au choix · M
*Ajouté le 2026-11-24 : plusieurs motifs de fond, comme WhatsApp, pour rendre la conversation plus attirante.*
- [ ] Plusieurs fonds (motifs et couleurs) qui respectent les thèmes clair et sombre et gardent les contrastes 4,5:1 sur les bulles.
*Décidé le 2026-11-24 : le choix est gardé sur le compte (option B).*
- [ ] Migration additive : un champ `chatBackground` sur `User`, avec une valeur par défaut. Route `PATCH` du profil mise à jour et documentée dans `docs/08-api.md`.
- [ ] Le choix se fait depuis le menu « ⋮ » de l'en-tête de la conversation (maquette), et aussi au Profil ; il s'applique à toutes les conversations.
- [ ] Le « ⋮ » est un vrai bouton (cible ≥ 44 px, menu au clavier) : il ouvre au minimum « Fond de la conversation ».
- [ ] Le motif est décoratif, sans aucun texte dans l'image ; tests unitaires.
