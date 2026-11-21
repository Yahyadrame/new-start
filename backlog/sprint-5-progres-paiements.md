# Sprint 5 — Progrès, notifications, abonnements (E6, E7)

## NS-501 — XP, niveaux, série de jours · M
*Fait le 2026-11-21 : +5 XP par bonne réponse (#199) et +10 XP par message envoyé. Série de jours faite (fuseau de la personne, gelée en mode pause, mise à jour avec l'XP). `DailyActivity` créée (migration additive) : messages, parties et XP du jour comptés. Restent : +30 par épisode (attend le sprint 4), minutes parlées (attend les enregistrements, NS-403).*
- [ ] Règles : +10 XP par message, +5 par bonne réponse, +30 par épisode terminé ; série de jours calculée dans le fuseau de l'utilisateur ; mode pause respecté.
- [ ] `DailyActivity` mise à jour en temps réel ; minutes parlées issues de la durée des enregistrements.

## NS-502 — Écran Progrès (9) · M
*Découpé le 2026-11-21 : (1) API `GET /progress` (niveau et XP, 100 XP par niveau), (2) écran avec niveau et barre d'XP (fait, série de jours incluse), (3) API : `GET /progress` rend `week` et `figures` (à valider par le porteur : les 4 chiffres clés retenus sont messages, parties, XP de la semaine, jours actifs sur 7) ; (4) écran : chiffres et barres des minutes.*
- [ ] Niveau et XP, 4 chiffres clés, barres des minutes par jour ; bloc « Entre amis » masqué au MVP.

## NS-503 — Notifications (15) · M
- [ ] Web Push ; un rappel par jour maximum à l'heure choisie, seulement si l'utilisateur n'a pas pratiqué ; `NotificationLog` pour garantir la limite.
- [ ] Écran Notifications.

> Au lancement tout est gratuit : les tickets de paiement (NS-504 à NS-508) sont développés et testés en bac à sable, derrière le drapeau `payments.enabled = false`. Ils ne doivent rien afficher ni rien débiter tant que le porteur du projet n'a pas décidé de les activer.

## NS-509 — Limites d'usage du lancement · S
*Tranche 1 faite le 2026-11-21 (API) : 60 messages par jour, lus dans `DailyActivity`, réglables avec `MESSAGES_PER_DAY` (choix à valider : variable d'environnement plutôt que table `FeatureFlag`, sans redéploiement du code mais avec redémarrage). Un renvoi déjà enregistré passe même à la limite. Restent : message doux dans l'écran Conversation (code `USAGE_LIMIT`), limites écouter et dictée (attendent NS-205 et NS-206).*
- [ ] Limites de `docs/02-fonctionnalites.md` (section « Au lancement : tout est gratuit »), réglables sans redéploiement ; message doux à la limite, sans mention d'abonnement.

## NS-504 — Offres et prix · S
- [ ] Tables `Plan` et `PlanPrice`, `GET /plans?country=` ; écran Abonnement (10) affichant « Bientôt » tant que le paiement est désactivé.

## NS-505 — Paiement Wave · L
- [ ] Adaptateur Wave (mode test), webhook signé, idempotence, activation de l'abonnement.

## NS-506 — Paiement Orange Money · L
- [ ] Adaptateur Orange Money (mode test), même contrat.

## NS-507 — Paiement par carte · M
- [ ] Stripe Billing, renouvellement automatique, factures.

## NS-508 — Cycle de vie des abonnements · M
- [ ] Rappel 3 jours avant l'échéance (Wave, Orange Money), période de grâce, retour à Gratuit, annulation en 2 gestes.
- [ ] Réconciliation quotidienne et alerte en cas d'écart.
