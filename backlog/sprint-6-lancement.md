# Sprint 6 — Finition et préparation du lancement (E8)

## NS-601 — Tests de charge · M
- [ ] Scénarios k6 : 1 000 utilisateurs simultanés, 50 messages/s, WebSocket ; objectifs de `docs/12-qualite-tests.md`.
- [ ] Mise à jour en production simulée pendant la charge : 0 erreur.

## NS-602 — Accessibilité · M
*Tranche 1 faite le 2026-11-21 : axe-core sur Discussions, Explorer, Progrès et Jeux (API simulée), clair et sombre, mobile et ordinateur. Conversation, Série, Notifications, Code de l'inscription et test de niveau ajoutés (écran Profil en attente de NS-610). Résultat du niveau ajouté. Restent : Profil, navigation clavier et lecteurs d'écran (à tester à la main par le porteur du projet).*
- [ ] axe-core sur tous les écrans, clair et sombre ; navigation clavier ; lecteurs d'écran sur les parcours principaux.

## NS-610 — Contraste de la couleur danger · S
- [ ] `--color-danger` (`#E5484D`, `docs/04-design-system.md`) n'atteint que 3,91:1 : texte d'erreur sur fond blanc (« Ton carnet ne se charge pas. ») et texte blanc du bouton de suppression sur l'écran Profil. La règle est 4,5:1. Trouvé par axe-core le 2026-11-21 ; l'écran Profil n'est pas encore dans `screens-accessibility.spec.ts` à cause de cela.
- [ ] **À décider par le porteur du projet** : assombrir le jeton (par exemple vers `#C8363B`, à vérifier dans les deux thèmes, change les maquettes), ou garder `#E5484D` pour les grands textes et les icônes seulement et utiliser une teinte plus sombre pour le texte et les boutons.
- [ ] Ensuite : ajouter Profil au test d'accessibilité.

## NS-603 — Sécurité · M
*Tranche 1 faite le 2026-11-21 : en-têtes de sécurité du site web (nosniff, cadres interdits, referrer, HSTS, micro permis pour le site seulement). Tranche 2 : mêmes en-têtes sur l'API, avec une CSP « rien n'est chargé », sans nouvelle dépendance. Tranche 3 : limite de débit générale par IP (`RATE_LIMIT_PER_MINUTE`, éteinte par défaut ; à activer sur staging après avoir réglé `TRUST_PROXY_HOPS`, 1 derrière Render, à vérifier). Restent : Content-Security-Policy du site (demande un nonce pour les scripts de Next.js), compteurs partagés via Redis quand l'API aura plusieurs instances, OWASP ZAP sur staging.*
- [ ] OWASP ZAP sur staging, correction des alertes hautes ; revue des en-têtes, CORS, limites de débit.
- [ ] Revue des points sensibles SonarQube.

## NS-604 — Sauvegardes et reprise · S
- [ ] Restauration complète de la base sur un environnement vide, chronométrée, documentée.

## NS-605 — Tableaux de bord produit · M
- [ ] Rétention J1 / J7, minutes parlées, conversion, coût IA par utilisateur (événements anonymisés, sans contenu de message).

## NS-606 — Conformité · S
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
*Ajouté le 2026-11-15, venu du sprint 0.*
- [ ] Chaque nuit : tests e2e complets sur staging, évaluations IA, audit des dépendances, scan OWASP ZAP.
