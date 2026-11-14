# New Start — dossier de lancement du projet

New Start est une application web puis mobile pour apprendre à **parler** anglais : une messagerie façon WhatsApp avec des contacts IA, une série interactive dont l'utilisateur est le héros, des jeux courts, des appels vocaux et vidéo, et un suivi des progrès.

Ce dossier contient tout ce qu'il faut pour réaliser le projet avec Claude Code, comme une équipe : le produit, le design, l'architecture, l'infrastructure, le processus et le backlog.

## Par où commencer

1. Ouvrir ce dossier comme racine du dépôt Git, puis lancer Claude Code dedans.
2. Claude Code lit automatiquement `CLAUDE.md` : ce sont ses règles de travail.
3. Lui demander : « Lis `docs/` dans l'ordre, puis démarre le sprint 0 par le ticket NS-000. »
4. Claude Code réalise tout (code, infrastructure, déploiement), vous demande votre accord avant chaque action sur GitHub, et vous pose des questions à choix quand une décision vous revient. Vous testez en ligne et validez à chaque fin de sprint.

## Contenu

| Fichier | Contenu |
| --- | --- |
| `CLAUDE.md` | Règles pour Claude Code : rôles, conventions, définition de « terminé » |
| `docs/01-vision-produit.md` | Le problème, la cible, la promesse, les indicateurs |
| `docs/02-fonctionnalites.md` | Toutes les fonctionnalités, classées MVP / V2 / V3 |
| `docs/03-contenu-pedagogique.md` | Le noyau d'anglais parlé, la série, les contacts IA |
| `docs/04-design-system.md` | Palette, typographie, composants, thèmes clair et sombre, logo |
| `docs/05-ecrans.md` | Les 17 écrans du MVP, écran par écran |
| `docs/06-architecture.md` | Monorepo, services, flux de données, choix techniques |
| `docs/07-modele-de-donnees.md` | Entités et schéma Prisma |
| `docs/08-api.md` | Routes REST, événements temps réel, contrats |
| `docs/09-ia-agents.md` | Agents IA, prompts, corrections, voix, coûts, sécurité |
| `docs/10-devops.md` | Phase 1 en ligne gratuite (Vercel, Render, Neon), phase 2 VPS ou AWS, Docker, Kubernetes, CI/CD, SonarQube, supervision |
| `docs/11-securite-donnees.md` | Authentification, données personnelles, conformité |
| `docs/12-qualite-tests.md` | Stratégie de tests, revue de code, qualité |
| `docs/13-roadmap-sprints.md` | Sprints du MVP, jalons, critères de sortie |
| `docs/14-paiements.md` | Wave, Orange Money, carte, abonnements |
| `docs/15-processus-equipe.md` | Façon de travailler : Git, PR, rituels, rôles |
| `docs/16-delegation-supervision.md` | Claude Code fait tout, le porteur du projet supervise : questions de choix, validations, déploiement dès le début |
| `docs/decisions.md` | Journal des décisions du porteur du projet |
| `backlog/` | Épopées et tickets prêts à développer |
| `data/` | Le noyau : 1 000 mots et 339 expressions orales (CSV) |
| `design/` | Logo SVG, prototype HTML cliquable, lien des maquettes |

## Lancer en local

Il suffit d'avoir Docker. Copiez `.env.example` en `.env`, puis, depuis la racine du dépôt :

| Commande | Ce qui démarre |
| --- | --- |
| `pnpm docker:deps` | PostgreSQL (port 5432) et Mailpit (boîte mail de test sur http://localhost:8025) |
| `pnpm docker:dev` | Les mêmes, plus `web` (http://localhost:3000) et `api` (http://localhost:4000) avec rechargement automatique. Mesuré le 2026-11-13 : environ 860 Mo de RAM pour l'ensemble (web 550 Mo, api 250 Mo, Postgres 30 Mo, Mailpit 20 Mo) |
| `pnpm docker:prod` | `web` et `api` construits avec les Dockerfiles de production |
| `pnpm docker:clean` | Arrête tout et supprime les conteneurs, les images locales et les volumes, donc la base locale |

`docker compose --profile redis` ajoute Redis, `--profile quality` ajoute SonarQube (environ 2 Go de RAM, à lancer rarement). Sans Node ni pnpm sur la machine, utilisez `docker compose -f infra/compose/docker-compose.yml` à la place des scripts.

Les profils `dev` et `prod` démarrent `web` et `api` seulement une fois les squelettes (NS-002) et les Dockerfiles (NS-004) livrés. Pour l'instant, `pnpm docker:deps` est la seule commande utilisable.

Mémoire mesurée au repos : PostgreSQL 22 Mo, Mailpit 6 Mo. Chaque conteneur a une limite (`mem_limit`) et le total visé avec le profil `dev` reste sous 2 Go. Cette mesure sera refaite quand `web` et `api` existeront.

## Tester en ligne

Le site web de staging est sur Vercel : <https://new-start-eta.vercel.app>. Il se met à jour à chaque fusion sur `main`.

L'API de staging est déployée à chaque fusion sur `main` : <https://newstart-api-staging.onrender.com/health/ready>. Sur l'offre gratuite de Render, elle s'endort après 15 minutes sans appel et met environ une minute à se réveiller. Le site affiche alors « Connexion au serveur… » le temps qu'elle revienne.

## Liens de référence

- Maquettes complètes (17 écrans, sombre et clair, logo) : <https://claude.ai/artifact/7WBnVmUHi25D7ttJimWESu>
- Document des fonctionnalités : <https://claude.ai/artifact/5MuqZWSyyrLB1XaedjWtMZ>
- Scripts de la série, semaine 1 : <https://claude.ai/artifact/1ucLs2Ddtb2WhJcGX7682c>
- Tableau du noyau d'anglais parlé : <https://claude.ai/artifact/PMn25jfkZKFj8WRYbD8UKe>
- Prototype de la messagerie et des jeux : <https://claude.ai/artifact/7AG1kD3u2jd7XKqum31muU>

Ces liens sont privés : ils ne s'ouvrent que pour leur propriétaire tant qu'ils ne sont pas partagés. Les contenus essentiels sont recopiés dans ce dossier.
