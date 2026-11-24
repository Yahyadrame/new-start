# Sprint 5 — Progrès, notifications, abonnements (E6, E7)

## NS-501 — XP, niveaux, série de jours · M
*Fait le 2026-11-21 : +5 XP par bonne réponse (#199) et +10 XP par message envoyé. Série de jours faite (fuseau de la personne, gelée en mode pause, mise à jour avec l'XP). `DailyActivity` créée (migration additive) : messages, parties et XP du jour comptés. Restent : +30 par épisode (attend le sprint 4), minutes parlées (attend les enregistrements, NS-403).*
- [ ] Règles : +10 XP par message, +5 par bonne réponse, +30 par épisode terminé ; série de jours calculée dans le fuseau de l'utilisateur ; mode pause respecté.
- [ ] `DailyActivity` mise à jour en temps réel ; minutes parlées issues de la durée des enregistrements.

## NS-502 — Écran Progrès (9) · M
*Découpé le 2026-11-21 : (1) API `GET /progress` (niveau et XP, 100 XP par niveau), (2) écran avec niveau et barre d'XP (fait, série de jours incluse), (3) API : `GET /progress` rend `week` et `figures` (à valider par le porteur : les 4 chiffres clés retenus sont messages, parties, XP de la semaine, jours actifs sur 7) ; (4) écran : chiffres et barres des minutes (fait ; les barres attendent les minutes parlées de NS-403).*
- [ ] Niveau et XP, 4 chiffres clés, barres des minutes par jour ; bloc « Entre amis » masqué au MVP.

## NS-503 — Notifications (15) · M
*Tranche 1 faite le 2026-11-21 : règle `reminderDue` (un rappel par jour, à l'heure choisie ou après, pas si la personne a pratiqué, pas en pause), fonction pure. Tranche 2 : table `NotificationLog` (clé unique personne + type + jour, qui garantit un rappel par jour) et cas d'usage `SendReminders`, sans planificateur ni envoi. Tranche 7 : port `PushSender` et adaptateur `web-push` (clés `VAPID_*`, factice sans elles), pas encore branché. Restent : table des abonnements et route pour s'abonner, envoi depuis `SendReminders`, clés VAPID à poser par le porteur du projet, service worker (NS-305), écran Notifications. Tranche 3 : `GET /notifications` (liste, plus récentes d'abord), sans `read-all` pour l'instant. Tranche 4 : écran `/notifications` (Aujourd'hui / Cette semaine, état vide, erreur), testé avec axe. Tranche 5 : planificateur dans l'API (minuteur, `REMINDERS_INTERVAL_SECONDS`, éteint par défaut ; à mettre à 60 sur staging pour valider, puis à passer dans le worker avec NS-017). À décider avec le porteur : d'où on y accède (cloche sur Discussions ?) car la barre du bas n'a pas d'onglet pour lui, et si le réglage de l'heure du rappel, déjà prévu au Profil, se répète ici.*
- [ ] Web Push ; un rappel par jour maximum à l'heure choisie, seulement si l'utilisateur n'a pas pratiqué ; `NotificationLog` pour garantir la limite.
- [x] Écran Notifications.
- [x] Tranche 6 : cloche en haut à droite de toutes les pages avec la barre du bas, avec un point quand il y a du non-lu (décidé le 2026-11-21). Compteur `GET /notifications/unread-count` (#232) ; l'heure du rappel reste au Profil seulement. À aligner avec les maquettes de l'en-tête.

> Au lancement tout est gratuit : les tickets de paiement (NS-504 à NS-508) sont développés et testés en bac à sable, derrière le drapeau `payments.enabled = false`. Ils ne doivent rien afficher ni rien débiter tant que le porteur du projet n'a pas décidé de les activer.

## NS-509 — Limites d'usage du lancement · S
*Tranche 1 faite le 2026-11-21 (API) : 60 messages par jour, lus dans `DailyActivity`, réglables avec `MESSAGES_PER_DAY` (choix à valider : variable d'environnement plutôt que table `FeatureFlag`, sans redéploiement du code mais avec redémarrage). Un renvoi déjà enregistré passe même à la limite. Le message doux de l'écran Conversation existe (#200) et ne s'affiche que pour le code `USAGE_LIMIT` : un 429 `RATE_LIMITED` propose de réessayer. Restent : limites écouter et dictée (attendent NS-205 et NS-206).*
- [ ] Limites de `docs/02-fonctionnalites.md` (section « Au lancement : tout est gratuit »), réglables sans redéploiement ; message doux à la limite, sans mention d'abonnement.

## NS-504 — Offres et prix · S
*Tranche 1 faite le 2026-11-21 (API) : tables `Plan` et `PlanPrice` (migration additive) remplies avec les prix proposés de `docs/14-paiements.md`, et `GET /plans?country=`. Ces prix restent à valider par le porteur du projet avant toute activation. Tranche 2 : page `/plans` avec la mention « Bientôt » (écran provisoire commun), testée avec axe. Les offres s'afficheront quand le porteur du projet décidera d'activer les paiements.*
- [x] Tables `Plan` et `PlanPrice`, `GET /plans?country=` ; écran Abonnement (10) affichant « Bientôt » tant que le paiement est désactivé (#246, #247).

## NS-505 — Paiement Wave · L
- [ ] Adaptateur Wave (mode test), webhook signé, idempotence, activation de l'abonnement.

## NS-506 — Paiement Orange Money · L
- [ ] Adaptateur Orange Money (mode test), même contrat.

## NS-507 — Paiement par carte · M
- [ ] Stripe Billing, renouvellement automatique, factures.

## NS-508 — Cycle de vie des abonnements · M
- [ ] Rappel 3 jours avant l'échéance (Wave, Orange Money), période de grâce, retour à Gratuit, annulation en 2 gestes.
- [ ] Réconciliation quotidienne et alerte en cas d'écart.
