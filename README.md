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

## Liens de référence

- Maquettes complètes (17 écrans, sombre et clair, logo) : <https://claude.ai/artifact/7WBnVmUHi25D7ttJimWESu>
- Document des fonctionnalités : <https://claude.ai/artifact/5MuqZWSyyrLB1XaedjWtMZ>
- Scripts de la série, semaine 1 : <https://claude.ai/artifact/1ucLs2Ddtb2WhJcGX7682c>
- Tableau du noyau d'anglais parlé : <https://claude.ai/artifact/PMn25jfkZKFj8WRYbD8UKe>
- Prototype de la messagerie et des jeux : <https://claude.ai/artifact/7AG1kD3u2jd7XKqum31muU>

Ces liens sont privés : ils ne s'ouvrent que pour leur propriétaire tant qu'ils ne sont pas partagés. Les contenus essentiels sont recopiés dans ce dossier.
