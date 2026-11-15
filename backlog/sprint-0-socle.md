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
- [x] `apps/web` : Next.js 15, Tailwind avec les jetons de `docs/04-design-system.md`, thème Système/Clair/Sombre, page d'accueil avec le logo.
- [x] `apps/api` : NestJS 11, Prisma, routes `/health/live` et `/health/ready` (vérifie base et Redis), logs pino JSON, arrêt propre sur `SIGTERM`.
- [x] `apps/worker` : NestJS standalone, job de démonstration, interface `Queue` et file en mémoire. Décision du porteur (2026-11-13) : les adaptateurs pg-boss et BullMQ sont reportés aux tickets NS-016 et NS-017 ; `RUN_JOBS=inline` dans l'API attend que la file vive dans un paquet partagé.
- [x] `/health/ready` vérifie la base, et Redis seulement s'il est configuré.

## NS-013 — Bibliothèque de composants et Storybook · M
- [ ] `packages/ui` avec shadcn/ui + Radix, Tailwind, `cva`, Lucide, Sonner, Vaul, Motion (liste de `docs/04-design-system.md`).
- [ ] Jetons de couleur clair et sombre, typographie, rayons, espacements.
- [ ] Primitives : Button, Input, Dialog, Sheet, Avatar, Badge, Tabs, Switch, Skeleton, Toast ; chacune avec story clair et sombre et test d'accessibilité.
- [ ] Storybook publié en ligne (projet Vercel séparé ou GitHub Pages) pour que le porteur du projet voie les composants.

## NS-014 — Règles d'architecture vérifiées en CI · S
- [x] `dependency-cruiser` et `eslint-plugin-boundaries` configurés selon `docs/06-architecture.md` ; un import interdit fait échouer la CI.
- [ ] Modèle de module back et de fonctionnalité front générés par une commande : reporté au ticket NS-015.

## NS-015 — Générateurs de module et de fonctionnalité · S
- [ ] `pnpm gen:module <nom>` crée un module back (`domain`, `application`, `infrastructure`, `interface`, `<nom>.module.ts`) dans `apps/api`.
- [ ] `pnpm gen:feature <nom>` crée une fonctionnalité front (`components/`, `hooks/`, `api/`, `store/`, `index.ts`) dans `apps/web`.
- [ ] Le code généré respecte les règles de NS-014 et vient avec son test unitaire.
- Dépend de NS-002 (dossiers `apps/api` et `apps/web`).

## NS-016 — File de jobs pg-boss (phase 1, sur Neon) · S
- [ ] Adaptateur `PgBossQueue` derrière le port `Queue` (`modules/jobs/domain/queue.ts`), avec son test unitaire ; la file en mémoire reste l'adaptateur des tests et du local.
- [ ] Intervalle d'interrogation de 30 s ou plus, pour laisser Neon s'endormir (risque décrit dans `docs/decisions.md`) ; mesurer les CU-heures consommées et alerter le porteur au-delà de 80.
- [ ] La file vit dans un paquet partagé, pour que l'API (`RUN_JOBS=inline`) et le worker l'utilisent.
- Dépend de NS-002 et d'une base Neon (NS-008).

## NS-017 — File de jobs BullMQ (phase 2, sur Redis) · S
- [ ] Adaptateur `BullMqQueue` derrière le port `Queue`, avec son test unitaire ; choisi par variable d'environnement quand `REDIS_URL` est défini.
- [ ] `RUN_JOBS=separate` : le worker traite les jobs, l'API ne fait que les poser.
- [ ] `/health/ready` vérifie déjà Redis s'il est configuré (NS-002) ; ajouter la lecture de la longueur de la file.
- Dépend de NS-016 (paquet partagé) ; phase 2 seulement.

## NS-003 — Environnement local conteneurisé · M
- [x] `infra/compose/docker-compose.yml` de `docs/10-devops.md` : PostgreSQL et Mailpit par défaut ; profil `dev` (web et api en conteneurs avec rechargement automatique, code monté en volume) ; profil `prod` (images des Dockerfiles de production) ; profils `redis` et `quality` facultatifs. Versions d'images épinglées.
- [x] Limites de mémoire par conteneur ; RAM du profil `dev` mesurée le 2026-11-13 : environ 860 Mo (cible : moins de 2 Go).
- [ ] Adaptateurs factices pour l'IA, Brevo et Cloudinary afin de développer sans clé.
- [x] Scripts racine : `pnpm docker:dev`, `pnpm docker:prod`, `pnpm docker:clean`.
- [x] `README` de démarrage : sur une machine neuve avec seulement Docker, `docker compose --profile dev up` ouvre l'appli sur `http://localhost:3000`.
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
- [x] (PR 1) Rien n'est déployé : les fichiers sont écrits et vérifiés en CI (`helm lint`, `helm template` + `kubeconform`) pour que la phase 2 (VPS ou AWS) ne demande aucune réécriture.
- [x] (PR 3) Valeurs par cible : `values-vps.yaml` (k3s) et `values-aws.yaml` (EC2 + k3s, ou EKS).
- [x] (PR 1) Chart Helm `new-start` : déploiements web/api/worker, `RollingUpdate maxUnavailable: 0`, sondes, ressources.
- [x] (PR 2) PDB, HPA, NetworkPolicies.
- [x] (PR 2) Ingress NGINX + cert-manager.
- [x] (PR 3) Secrets via Sealed Secrets (manifestes seulement ; External Secrets si AWS).

## NS-011 — Environnements d'aperçu par PR · M
Recadré le 2026-11-14 : pas d'API d'aperçu sur Render (voir `docs/decisions.md`), donc l'aperçu d'une PR est un front Vercel qui appelle l'API de staging.
- [x] Front : aperçu Vercel automatique de chaque PR (intégration Git du projet `new-start`), avec `NEXT_PUBLIC_API_URL` définie aussi pour Preview.
- [x] CORS : `CORS_ORIGINS` accepte un motif avec `*` (`https://new-start-*-yhd.vercel.app`), ce qui couvre les URL d'aperçu.
- [x] Le lien d'aperçu est commenté dans la PR par Vercel.
- [ ] Reporté au ticket NS-021 : branche Neon par PR et aperçu d'API.
- [ ] Phase 2 seulement : Argo CD ApplicationSet avec générateur Pull Request.

## NS-012 — Données de démonstration · S
- [x] Mécanisme de seed (`prisma db seed`, idempotent) et noyau d’anglais (mots et expressions) chargé sur staging par `cd-staging`.
- [ ] Comptes de test, conversations et épisodes : ajoutés au seed par chaque ticket qui crée sa table ; SMS et paiements en mode test.

## NS-008 — Staging en ligne · M
- [ ] Projet Vercel `newstart-web` relié au dépôt (avec l'accord du porteur du projet pour installer l'application GitHub de Vercel).
- [ ] Service Render `newstart-api` (offre Free) déployé depuis l'image GHCR construite par la CI, avec `RUN_JOBS=inline` ; variables d'environnement saisies par le porteur du projet.
- [ ] `cd-staging.yml` : migration Prisma sur Neon (`prisma migrate deploy`) puis appel du deploy hook Render, puis tests de fumée sur `/health/ready` (avec attente du réveil).
- [ ] Écran « Connexion au serveur… » côté front pendant le réveil de l'API.
- [ ] Le lien de staging est donné au porteur du projet et noté dans le `README`.

## NS-009 — Supervision · M
- [x] Sentry côté API et côté navigateur, éteint tant que le DSN est vide, sans donnée personnelle ni contenu de message.
- [ ] Le porteur du projet crée le compte Sentry et saisit `SENTRY_DSN` (Render) et `NEXT_PUBLIC_SENTRY_DSN` (Vercel) ; Claude vérifie qu'une erreur de test arrive.
- [x] Sonde sur `/health/live` : UptimeRobot refuse d'ouvrir le formulaire de création, remplacée par un workflow GitHub Actions (NS-025).
- [ ] Reporté au ticket NS-022 : OpenTelemetry, alerte 5xx, erreurs serveur de Next.js.

## NS-010 — Choix des fournisseurs IA (ADR) · M
- [x] Comparer 2 fournisseurs LLM, STT et TTS sur 50 phrases réelles (qualité, latence depuis Dakar, prix).
- [x] Rédiger `docs/adr/0001-fournisseurs-ia.md` (accepté ; STT sur voix réelles et choix du TTS restent à faire, voir l'ADR).
- [x] Interfaces `LlmProvider`, `SttProvider`, `TtsProvider` dans `packages/ai`, avec un adaptateur factice et ses tests.

## NS-018 — Compose dev sans fichiers appartenant à root · S
- [ ] Les conteneurs du profil `dev` tournent avec l'UID et le GID de l'utilisateur (`user: "${UID}:${GID}"`), pour que `.next` et `apps/api/src/generated` restent à lui.
- [ ] `README` : comment exporter `UID` et `GID` (ou valeur par défaut 1000).
- [ ] Vérifié : après `docker compose --profile dev up`, `find apps -user root -not -path "*/node_modules/*"` ne renvoie rien.

## NS-019 — Actions GitHub épinglées par SHA · S
- [x] `ci.yml` : `actions/checkout`, `actions/setup-node` et `pnpm/action-setup` épinglés par SHA de commit complet (avec le tag en commentaire), comme `storybook.yml`.
- [x] Le test de `packages/config` exige un SHA, plus seulement un tag majeur (les trois workflows).
- [x] Mise à jour des SHA par Dependabot (choix du porteur : `.github/dependabot.yml`, actions GitHub, chaque semaine, regroupées).

## NS-020 — Polices hébergées avec l'application · S
- [x] `next/font/google` télécharge Space Grotesk et Inter à chaque `next build` : sans accès à Google, le build échoue (`Failed to fetch Space Grotesk`), ce qui rend le build de l'image web instable.
- [x] Remplacer par des polices embarquées (`next/font/local` ou paquets `@fontsource`), mêmes graisses et mêmes variables CSS.
- [x] Le build de l'image web réussit sans réseau vers Google ; tests à jour.

## NS-021 — Branche Neon et API d'aperçu par PR · M
À reprendre quand une API d'aperçu existera (offre Render payante ou autre hébergeur) et que le seed de NS-012 sera livré. Avant, une branche Neon par PR ne servirait à rien : l'aperçu front appelle l'API de staging.
- [ ] `preview.yml` crée une branche Neon à l'ouverture de la PR, applique `prisma migrate deploy`, charge le seed de démonstration, et la supprime à la fermeture (limite gratuite : 10 branches par projet).
- [ ] Aperçu d'API de la PR quand elle touche `apps/api` ou `packages/`, relié à cette branche ; sinon le front appelle l'API de staging.
- [ ] Le lien de l'aperçu est commenté dans la PR ; tests à jour.

## NS-022 — OpenTelemetry et alerte d'erreurs · M
- [x] OpenTelemetry branché mais désactivé par défaut ; activé vers Grafana Cloud quand le porteur du projet le demande.
- [x] Alerte : taux d'échec > 2 % pendant 5 minutes (monitor Sentry « Failure Rate », traces à 10 % sur staging). Sentry compte aussi les 404 comme échecs.
- [ ] Erreurs serveur de Next.js (`apps/web`) envoyées à Sentry, avec le même nettoyage que le navigateur.

## NS-023 — Route de test pour Sentry côté API · S
Sur staging, rien ne prouve aujourd'hui que `SENTRY_DSN` est bien lue par l'API : il faudrait attendre une vraie erreur 500.
- [x] `GET /health/sentry-test` (module `health`) lève une erreur volontaire, uniquement si la variable `SENTRY_TEST_TOKEN` est définie et que l'en-tête `x-sentry-test-token` la contient ; sinon la route répond 404.
- [x] `SENTRY_TEST_TOKEN` est ajoutée à `.env.example` sans valeur ; la valeur est posée sur Render par le porteur du projet.
- [x] Vérifié sur staging : l'appel avec le bon jeton fait apparaître l'erreur dans le projet `newstart-api` de Sentry ; sans jeton, la route répond 404 et rien n'est envoyé.
- [x] Tests unitaires : route absente sans variable, refus avec un mauvais jeton, erreur levée avec le bon jeton.

## NS-024 — Adaptateurs IA réels et banc de comparaison · M
Suite de NS-010 (ADR 0001). Sans eux, l'application ne parle à aucune vraie IA.
- [ ] `GroqLlm` (`openai/gpt-oss-20b`) et `GeminiLlm` (`gemini-3.5-flash-lite`, secours) implémentent `LlmProvider` ; `GroqStt` (`whisper-large-v3-turbo`) implémente `SttProvider` ; `GeminiTts` implémente `TtsProvider`. `fetch` injecté, délai maximal, clé lue dans l'environnement, jamais journalisée.
- [x] Validation Zod du JSON `{ reply, fix }` avec une nouvelle tentative, puis `reply` brut et `fix = null` (`docs/09-ia-agents.md`).
- [x] Plafond d'usage codé et repli sur l'adaptateur factice quand le quota est épuisé (décision budget du 2026-11-13) ; réessai sur les erreurs 429 et 5xx, et sur l'erreur 400 « texte au lieu d'audio » de Gemini TTS.
- [x] Choix du fournisseur par variable d'environnement ; `.env.example` à jour.
- [x] `pnpm --filter @newstart/ai compare` relance la comparaison avec ces adaptateurs ; la logique de notation vit dans `src/` avec ses tests.
- [x] Tests unitaires avec `fetch` simulé pour chaque adaptateur, couverture ≥ 80 %.

## NS-025 — Sonde de disponibilité par Better Stack · S
Remplace UptimeRobot, dont le formulaire de création ne s'ouvre pas, puis un workflow GitHub Actions que GitHub n'a jamais déclenché (décisions du porteur du projet, 2026-11-15).
- [x] Monitor Better Stack (offre gratuite) sur `https://newstart-api-staging.onrender.com/health/live`, vérifié toutes les 3 minutes.
- [x] Alertes par e-mail à l'adresse du compte.
- [x] La sonde n'appelle pas la base : Neon peut s'endormir.
- [x] Vérifié : l'API répond en moins d'une seconde après une pause (0,17 s).
- [x] `.github/workflows/uptime.yml` supprimé : GitHub ne lançait aucune exécution planifiée (aucune en plus de 2 heures malgré les minutes décalées).

## NS-026 — Route de test pour Sentry côté web · S
Rien ne déclenche aujourd'hui `onRequestError` sur staging : la dernière case de NS-022 ne peut pas être vérifiée.
- [x] `GET /api/sentry-test` (apps/web) lève une erreur volontaire, uniquement si `SENTRY_TEST_TOKEN` est défini sur Vercel et que l'en-tête `x-sentry-test-token` le contient ; sinon elle répond 404.
- [x] Tests unitaires : 404 sans jeton configuré, sans en-tête ou avec un mauvais jeton ; erreur avec le bon.
- [ ] Vérifié sur staging : l'erreur apparaît dans Sentry (projet `newstart-web`) ; case « erreurs serveur de Next.js » de NS-022 cochée ; `SENTRY_TEST_TOKEN` retiré de Vercel.
