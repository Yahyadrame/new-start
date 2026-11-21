# Sprint 6 — Finition et préparation du lancement (E8)

## NS-601 — Tests de charge · M
- [ ] Scénarios k6 : 1 000 utilisateurs simultanés, 50 messages/s, WebSocket ; objectifs de `docs/12-qualite-tests.md`.
- [ ] Mise à jour en production simulée pendant la charge : 0 erreur.

## NS-602 — Accessibilité · M
*Tranche 1 faite le 2026-11-21 : axe-core sur Discussions, Explorer, Progrès et Jeux (API simulée), clair et sombre, mobile et ordinateur. Conversation, Série, Notifications, Code de l'inscription et test de niveau ajoutés (écran Profil en attente de NS-610). Résultat du niveau ajouté. Profil ajouté (NS-610). Tranche 2 : test Playwright de navigation au clavier sur onze écrans (Tab, focus visible, pas de piège), clair et sombre, mobile et ordinateur. Restent : l'ordre de lecture et les lecteurs d'écran, à tester à la main par le porteur du projet.*
- [x] axe-core sur tous les écrans, clair et sombre.
- [ ] Navigation clavier ; lecteurs d'écran sur les parcours principaux.

## NS-610 — Contraste de la couleur danger · S
- [ ] `--color-danger` (`#E5484D`, `docs/04-design-system.md`) n'atteint que 3,91:1 : texte d'erreur sur fond blanc (« Ton carnet ne se charge pas. ») et texte blanc du bouton de suppression sur l'écran Profil. La règle est 4,5:1. Trouvé par axe-core le 2026-11-21 ; l'écran Profil n'est pas encore dans `screens-accessibility.spec.ts` à cause de cela.
- [x] Décidé par le porteur du projet le 2026-11-21 : assombrir le jeton. `--color-danger` vaut `#C8363B` en clair et reste `#E5484D` en sombre (5,37:1 sur le noir) ; le nouveau `--color-danger-solid` (`#C8363B`) sert de fond aux boutons rouges, texte blanc dessus (5,19:1). Un test de contraste garde les valeurs.
- [x] Profil ajouté au test d'accessibilité.

## NS-603 — Sécurité · M
*Tranche 1 faite le 2026-11-21 : en-têtes de sécurité du site web (nosniff, cadres interdits, referrer, HSTS, micro permis pour le site seulement). Tranche 2 : mêmes en-têtes sur l'API, avec une CSP « rien n'est chargé », sans nouvelle dépendance. Tranche 3 : limite de débit générale par IP (`RATE_LIMIT_PER_MINUTE`, éteinte par défaut ; à activer sur staging après avoir réglé `TRUST_PROXY_HOPS`, 1 derrière Render, à vérifier). Restent : Content-Security-Policy du site (demande un nonce pour les scripts de Next.js), compteurs partagés via Redis quand l'API aura plusieurs instances, OWASP ZAP sur staging.*
- [ ] OWASP ZAP sur staging, correction des alertes hautes ; revue des en-têtes, CORS, limites de débit.
- [x] Revue des points sensibles SonarQube : 0 point à relire sur `main` le 2026-11-21 (API publique de SonarCloud, statut TO_REVIEW). À refaire avant la mise en production.

## NS-604 — Sauvegardes et reprise · S
*En attente du porteur (décision du 2026-11-21) : l'export `pg_dump` hebdomadaire (artefact privé) ne démarre que quand il fournit le secret `BACKUP_DATABASE_URL` (idéalement un rôle en lecture seule) et la version de PostgreSQL de Neon. Le dump contient des données personnelles.*
- [ ] Export `pg_dump` hebdomadaire par un workflow GitHub Actions, gardé en artefact privé (`docs/10-devops.md`).
- [ ] Restauration complète de la base sur un environnement vide, chronométrée, documentée.

## NS-605 — Tableaux de bord produit · M
- [ ] Rétention J1 / J7, minutes parlées, conversion, coût IA par utilisateur (événements anonymisés, sans contenu de message).

## NS-606 — Conformité · S
*Tranche 1 faite le 2026-11-21 : pages `/terms` et `/privacy`, rédigées à partir de `docs/11` seulement, avec la mention « version provisoire », liées depuis l'inscription et testées avec axe. Restent : relecture par un professionnel, coordonnées de contact à ajouter, démarche auprès de la CDP.*
- [ ] Pages Conditions d'utilisation et Politique de confidentialité (rédaction à faire valider) ; démarche auprès de la CDP au Sénégal.

## NS-607 — Mise en production · M
- [ ] Environnement `production` protégé, domaine, sondes externes, procédure de `docs/10-devops.md` déroulée une première fois.
- [ ] Ouverture de la bêta fermée (liste d'attente).

## NS-017 — File de jobs BullMQ (phase 2, sur Redis) · S
*Déplacé du sprint 0 le 2026-11-15 : il sert ici, pas avant.*
Phase 2 seulement : quand l'API quitte l'hébergement gratuit et que Redis existe.
- [ ] Adaptateur `BullMqQueue` derrière le port `Queue`, avec son test unitaire ; choisi par variable d'environnement quand `REDIS_URL` est défini.
- [ ] `RUN_JOBS=separate` : le worker traite les jobs, l'API ne fait que les poser.
- [ ] `/health/ready` vérifie déjà Redis s'il est configuré (NS-002) ; ajouter la lecture de la longueur de la file.
- Dépend de NS-016 (paquet partagé) ; phase 2 seulement.

## NS-021 — Branche Neon et API d'aperçu par PR · M
*Déplacé du sprint 0 le 2026-11-15 : il sert ici, pas avant.*
Il faut une API d'aperçu, donc l'hébergement de production décidé avec le porteur du projet.
À reprendre quand une API d'aperçu existera (offre Render payante ou autre hébergeur) et que le seed de NS-012 sera livré. Avant, une branche Neon par PR ne servirait à rien : l'aperçu front appelle l'API de staging.
- [ ] `preview.yml` crée une branche Neon à l'ouverture de la PR, applique `prisma migrate deploy`, charge le seed de démonstration, et la supprime à la fermeture (limite gratuite : 10 branches par projet).
- [ ] Aperçu d'API de la PR quand elle touche `apps/api` ou `packages/`, relié à cette branche ; sinon le front appelle l'API de staging.
- [ ] Le lien de l'aperçu est commenté dans la PR ; tests à jour.

## NS-608 — Workflow de version `release.yml` · S
*Ajouté le 2026-11-15, venu du sprint 0.*
- [ ] Un tag `vX.Y.Z` crée les notes de version, puis déploie en production après l'accord du porteur du projet (avec NS-607).

## NS-609 — Workflow de nuit `nightly.yml` · M
*Ajouté le 2026-11-15, venu du sprint 0. Tranche 1 faite le 2026-11-21 : `nightly.yml` lance l'audit des dépendances de production chaque nuit à 3 h (UTC) ; première passe : `postcss` forcé à 8.5.23 ou plus. Restent : e2e sur staging, évaluations IA, OWASP ZAP.*
- [ ] Chaque nuit : tests e2e complets sur staging, évaluations IA, audit des dépendances, scan OWASP ZAP.
