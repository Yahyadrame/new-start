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
*Découpé le 2026-11-21 en quatre PR, sans file ni temps réel d'abord (décision du jour) : (1) gabarit `agent.v1` (fait), (2) API de la réponse et de la correction (faite), (3) écran (fait : « en train d'écrire… » et relecture de l'historique toutes les 2 s pendant 60 s au plus, à retirer avec NS-202), (4) modération, détresse et évaluations. Le job `agent.reply` sur pg-boss viendra avec NS-016.*
- [ ] Job `agent.reply` dans le worker : prompt `agent.v1`, 16 derniers messages, sortie JSON validée par Zod, 2 nouvelles tentatives.
- [ ] Modération en entrée et en sortie ; cas de détresse traité selon `docs/09-ia-agents.md`.
- [ ] Idempotence par `clientId`.
- [ ] Jeux d'évaluation `corrections.jsonl` (200 cas) et `safety.jsonl` (100 cas) lancés en CI.

## NS-204 — Écran Conversation (4) · L
*Découpé le 2026-11-20 en trois PR : (1) API `GET /conversations/:id/messages`, (2) écran (bulles, historique, pagination), (3) composer et envoi HTTP idempotent, coupée en deux le 2026-11-20 pour tenir sous 400 lignes : API `POST /conversations/:id/messages` (faite), puis composer dans l'écran (le WebSocket de NS-202 le remplacera ; l'agent ne répond qu'avec NS-203).*
- [ ] Bulles, coches, « en train d'écrire… », carte « Plus naturel », suggestions de l'agent, composer avec micro. *Bulles, heures et carte « Plus naturel » faites (PR 2) ; composer fait (PR 3, champ et bouton d'envoi) ; « en train d'écrire… » fait par relecture de l'historique (NS-203, PR 3) en attendant le temps réel ; coches et suggestions attendent NS-202 ; micro : NS-206.*
- [x] Pagination par curseur en remontant. *Bouton « Voir les messages précédents » (PR 2).*
- [ ] États : envoi en cours, échec avec « Touche pour réessayer », limite gratuite atteinte. *Envoi en cours et échec faits (PR 3) ; limite gratuite : NS-208.*

## NS-209 — Marquer une conversation comme lue · S
*Ajouté le 2026-11-20 : ouvrir une conversation ne remet pas `unreadCount` à zéro, et la route d'historique ne le fait pas (une lecture ne modifie rien).*
- [ ] Route pour marquer la conversation lue (`unreadCount` à 0, `readAt` des messages du contact), appelée par l'écran Conversation à l'ouverture ; tests.

## NS-205 — Écouter et traduire · M
- [ ] `POST /messages/:id/speech` : TTS avec la voix de l'agent, mis en cache sur Cloudinary.
- [ ] `POST /messages/:id/translate` : traduction FR mise en cache.

## NS-206 — Dictée · M
- [ ] Enregistrement dans le navigateur (WebM/Opus), téléversement signé vers Cloudinary, transcription, texte inséré dans le champ.
- [ ] Repli si le micro est refusé : le bouton disparaît, l'écriture reste possible.

## NS-207 — Carnet · S
- [ ] « Ajouter au carnet » depuis une correction ; liste dans le profil.

## NS-208 — Limites d'usage · M
- [ ] Compteurs Redis par jour et par clé ; consolidation dans `UsageCounter` ; événement `quota.update`.

## NS-016 — File de jobs pg-boss (phase 1, sur Neon) · S
*Déplacé du sprint 0 le 2026-11-15 : il sert ici, pas avant.*
Les réponses d'agent, la voix et les e-mails passent par la file (NS-203, NS-205, NS-206).
- [ ] Adaptateur `PgBossQueue` derrière le port `Queue` (`modules/jobs/domain/queue.ts`), avec son test unitaire ; la file en mémoire reste l'adaptateur des tests et du local.
- [ ] Intervalle d'interrogation de 30 s ou plus, pour laisser Neon s'endormir (risque décrit dans `docs/decisions.md`) ; mesurer les CU-heures consommées et alerter le porteur au-delà de 80.
- [ ] La file vit dans un paquet partagé, pour que l'API (`RUN_JOBS=inline`) et le worker l'utilisent.
- Dépend de NS-002 et d'une base Neon (NS-008).
