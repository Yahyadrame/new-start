# Sprint 2 — Messagerie avec corrections (E2)

## NS-201 — Liste des discussions (3) · M
- [ ] Tri par dernier message, badges non lus, rôle en capitales, point « en ligne », filtres Tous / Non lus / Quotidien / Pro / Business / Voyage.
- [ ] Badge « IA » à côté de chaque nom.
- [ ] Statuts affichés en lecture seule (contenu fixe par agent au MVP).

## NS-202 — Passerelle temps réel · L
- [ ] Socket.IO espace `/rt`, authentification par jeton, adaptateur Redis, salles `user:<id>`.
- [ ] Événements de `docs/08-api.md` ; reconnexion automatique et rattrapage des messages manqués.
- [ ] Test : deux réplicas de l'API, un message envoyé sur l'un arrive par l'autre.

## NS-203 — Réponse d'agent et correction · L
- [ ] Job `agent.reply` dans le worker : prompt `agent.v1`, 16 derniers messages, sortie JSON validée par Zod, 2 nouvelles tentatives.
- [ ] Modération en entrée et en sortie ; cas de détresse traité selon `docs/09-ia-agents.md`.
- [ ] Idempotence par `clientId`.
- [ ] Jeux d'évaluation `corrections.jsonl` (200 cas) et `safety.jsonl` (100 cas) lancés en CI.

## NS-204 — Écran Conversation (4) · L
- [ ] Bulles, coches, « en train d'écrire… », carte « Plus naturel », suggestions de l'agent, composer avec micro.
- [ ] Pagination par curseur en remontant.
- [ ] États : envoi en cours, échec avec « Touche pour réessayer », limite gratuite atteinte.

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
