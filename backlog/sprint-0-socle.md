# Sprint 0 — Socle technique (E0)

Objectif : une page « Bonjour » déployée sur staging **en ligne** par la CI (front sur Vercel, API sur Render, base sur Neon), quality gate vert, sondes de santé OK. Le porteur du projet peut tester **en local** (version légère) et **en ligne** ; le déploiement et les traitements lourds sont en ligne (voir `docs/10-devops.md`).

**Ordre imposé** : NS-000 → NS-001 → NS-003 (environnement local conteneurisé) → NS-005 et NS-006 (CI + SonarQube) → NS-014 (règles d'architecture) → NS-002 (squelettes) → NS-013 (composants) → NS-004 → NS-008 (staging en ligne) → NS-011, NS-012, NS-009, NS-010 → NS-007 (fichiers Kubernetes préparés pour la phase 2). Aucun ticket de fonctionnalité avant que CI, quality gate et déploiement automatique sur staging soient verts.

## NS-000 — Mise en place GitHub et premières décisions · M
- [x] Poser au porteur du projet, en une seule fois, les choix de départ avec options et coûts : nom et visibilité du dépôt, confirmation de la pile gratuite de la phase 1 de `docs/10-devops.md` après revérification des limites du moment (Vercel Hobby, Render Free, Neon, pg-boss, Upstash facultatif, SonarQube Cloud, Sentry, Brevo, Cloudinary, UptimeRobot), région (Render : Francfort conseillé pour la latence depuis Dakar, à confirmer), garder ou non l'API éveillée par une sonde, sous-domaines gratuits, dépôt public ou privé (impact sur les minutes GitHub Actions et sur SonarQube Cloud), budget mensuel maximum pour l'IA.
- [ ] Ouvrir avec le porteur du projet les comptes gratuits, tous connectables avec son compte GitHub quand c'est possible (Vercel, Render, Neon, SonarQube Cloud, Sentry, Brevo, Cloudinary, UptimeRobot ; Upstash et Grafana Cloud plus tard si besoin) ; il saisit lui-même les clés dans les secrets. Aucun compte payant, aucune carte bancaire.
- [x] Consigner les réponses dans `docs/decisions.md`.
- [ ] Avec l'accord du porteur du projet : créer le dépôt, pousser ce dossier comme premier commit, configurer la protection de `main` (PR, CI, quality gate, approbation du porteur du projet).
- [ ] Avec son accord : créer les issues depuis `backlog/` (`gh issue create`), étiquettes par épopée et sprint, tableau GitHub Projects.
- [x] Lui demander s'il accorde des autorisations permanentes (par exemple pousser et ouvrir les PR sans demander) et les noter dans `docs/decisions.md`.
- [ ] Lister les accès à fournir (jetons, comptes fournisseurs) sans jamais demander de valeur secrète dans la conversation : expliquer où la saisir (secrets GitHub, coffre de l'hébergeur).

## NS-001 — Monorepo et outils · M
- [ ] pnpm + Turborepo, Node 22, TypeScript strict, structure de `docs/06-architecture.md`.
- [ ] `packages/config` : ESLint, Prettier, tsconfig partagés ; Husky, lint-staged, Commitlint.
- [ ] Scripts racine : `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- [ ] `.env.example` complet, sans valeurs réelles.

## NS-002 — Squelettes des applications · M
- [ ] `apps/web` : Next.js 15, Tailwind avec les jetons de `docs/04-design-system.md`, thème Système/Clair/Sombre, page d'accueil avec le logo.
- [ ] `apps/api` : NestJS 11, Prisma, routes `/health/live` et `/health/ready` (vérifie base et Redis), logs pino JSON, arrêt propre sur `SIGTERM`.
- [ ] `apps/worker` : NestJS standalone, job de démonstration. Interface `Queue` avec deux adaptateurs : **pg-boss** (phase 1, sur Neon) et BullMQ (phase 2). En phase 1, l'API lance les jobs dans son propre processus (`RUN_JOBS=inline`).
- [ ] `/health/ready` vérifie la base, et Redis seulement s'il est configuré.

## NS-013 — Bibliothèque de composants et Storybook · M
- [ ] `packages/ui` avec shadcn/ui + Radix, Tailwind, `cva`, Lucide, Sonner, Vaul, Motion (liste de `docs/04-design-system.md`).
- [ ] Jetons de couleur clair et sombre, typographie, rayons, espacements.
- [ ] Primitives : Button, Input, Dialog, Sheet, Avatar, Badge, Tabs, Switch, Skeleton, Toast ; chacune avec story clair et sombre et test d'accessibilité.
- [ ] Storybook publié en ligne (projet Vercel séparé ou GitHub Pages) pour que le porteur du projet voie les composants.

## NS-014 — Règles d'architecture vérifiées en CI · S
- [ ] `dependency-cruiser` et `eslint-plugin-boundaries` configurés selon `docs/06-architecture.md` ; un import interdit fait échouer la CI.
- [ ] Modèle de module back (`domain`, `application`, `infrastructure`, `interface`) et de fonctionnalité front générés par une commande (`pnpm gen:module`, `pnpm gen:feature`).

## NS-003 — Environnement local conteneurisé · M
- [x] `infra/compose/docker-compose.yml` de `docs/10-devops.md` : PostgreSQL et Mailpit par défaut ; profil `dev` (web et api en conteneurs avec rechargement automatique, code monté en volume) ; profil `prod` (images des Dockerfiles de production) ; profils `redis` et `quality` facultatifs. Versions d'images épinglées.
- [ ] Limites de mémoire par conteneur (limites en place, PostgreSQL + Mailpit mesurés à 28 Mo ; reste le profil `dev` après NS-002) ; mesurer et noter la RAM utilisée avec le profil `dev` (cible : moins de 2 Go).
- [ ] Adaptateurs factices pour l'IA, Brevo et Cloudinary afin de développer sans clé.
- [x] Scripts racine : `pnpm docker:dev`, `pnpm docker:prod`, `pnpm docker:clean`.
- [ ] `README` de démarrage (section écrite ; le port 3000 attend NS-002) : sur une machine neuve avec seulement Docker, `docker compose --profile dev up` ouvre l'appli sur `http://localhost:3000`.
- [ ] Le porteur du projet lance la commande sur sa machine et confirme que ça marche avant de clore le ticket.

## NS-004 — Images Docker · M
- [ ] Dockerfiles multi-étapes pour web, api, worker, exécution non root, `HEALTHCHECK`.
- [ ] Taille cible : < 250 Mo par image.

## NS-005 — CI GitHub Actions · M
- [ ] Workflows de `docs/10-devops.md` : `ci.yml`, `e2e.yml`, `preview.yml`, `cd-staging.yml`, `release.yml`, `nightly.yml`, `codeql.yml`.
- [ ] `ci.yml` : lint, typecheck, contrôle des imports, tests avec couverture, SonarQube + quality gate, build des images, scan Trivy (échec sur `CRITICAL`).
- [ ] Protection de `main` : PR, CI verte, 1 approbation.
- [ ] Renovate configuré.

## NS-006 — SonarQube · S
- [ ] Organisation et projet `newstart` sur SonarQube Cloud (offre Free), `sonar-project.properties`, analyse des PR avec commentaire.
- [ ] Quality gate « New Start » : 0 bug, 0 vulnérabilité, points sensibles revus, couverture ≥ 80 %, duplication ≤ 3 %, maintenabilité A.

## NS-007 — Fichiers Kubernetes et Helm prêts pour la phase 2 · M
- [ ] Rien n'est déployé : les fichiers sont écrits et vérifiés en CI (`helm lint`, `helm template` + `kubeconform`) pour que la phase 2 (VPS ou AWS) ne demande aucune réécriture.
- [ ] Valeurs par cible : `values-vps.yaml` (k3s) et `values-aws.yaml` (EC2 + k3s, ou EKS).
- [ ] Chart Helm `new-start` : déploiements web/api/worker, `RollingUpdate maxUnavailable: 0`, sondes, PDB, HPA, NetworkPolicies, ressources.
- [ ] Ingress NGINX + cert-manager ; secrets via External Secrets ou Sealed Secrets (manifestes seulement).

## NS-011 — Environnements d'aperçu par PR · M
- [ ] Front : aperçu Vercel automatique de chaque PR.
- [ ] Base : branche Neon par PR créée par `preview.yml`, migrée et chargée avec la démo, supprimée à la fermeture.
- [ ] API : aperçu Render de la PR quand elle touche `apps/api` ou `packages/`, sinon le front de l'aperçu appelle l'API de staging.
- [ ] Phase 2 seulement : Argo CD ApplicationSet avec générateur Pull Request.
- [ ] Le lien est commenté automatiquement dans la PR.

## NS-012 — Données de démonstration · S
- [ ] Seed de démonstration (comptes de test, conversations, épisodes) chargé sur staging et sur les aperçus ; SMS et paiements en mode test.

## NS-008 — Staging en ligne · M
- [ ] Projet Vercel `newstart-web` relié au dépôt (avec l'accord du porteur du projet pour installer l'application GitHub de Vercel).
- [ ] Service Render `newstart-api` (offre Free) déployé depuis l'image GHCR construite par la CI, avec `RUN_JOBS=inline` ; variables d'environnement saisies par le porteur du projet.
- [ ] `cd-staging.yml` : migration Prisma sur Neon (`prisma migrate deploy`) puis appel du deploy hook Render, puis tests de fumée sur `/health/ready` (avec attente du réveil).
- [ ] Écran « Connexion au serveur… » côté front pendant le réveil de l'API.
- [ ] Le lien de staging est donné au porteur du projet et noté dans le `README`.

## NS-009 — Supervision · M
- [ ] Sentry front et back ; sonde UptimeRobot (ou Better Stack) sur `/health/live`.
- [ ] OpenTelemetry branché mais désactivé par défaut ; activé vers Grafana Cloud quand le porteur du projet le demande.
- [ ] Alerte : taux d'erreur 5xx > 2 % pendant 5 minutes.

## NS-010 — Choix des fournisseurs IA (ADR) · M
- [ ] Comparer 2 fournisseurs LLM, STT et TTS sur 50 phrases réelles (qualité, latence depuis Dakar, prix).
- [ ] Rédiger `docs/adr/0001-fournisseurs-ia.md` ; implémenter les interfaces dans `packages/ai` avec un adaptateur factice pour les tests.
