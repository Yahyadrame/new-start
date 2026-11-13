# CLAUDE.md — règles de travail pour New Start

Tu travailles sur **New Start**, une application pour apprendre à parler anglais (messagerie avec des contacts IA, série interactive, jeux, appels). Lis `README.md`, puis `docs/` dans l'ordre des numéros avant d'écrire du code.

## Comment on travaille

**Tu fais tout le travail ; le porteur du projet supervise.** Tu codes, testes, gères l'infrastructure et le déploiement. Sur Git et GitHub, tu prépares tout mais tu **demandes son accord** avant de pousser, d'ouvrir ou de fusionner une PR, et avant de toucher aux réglages du dépôt. Lui choisit entre tes propositions, valide les livraisons et teste en ligne. Lis `docs/16-delegation-supervision.md` : il dit quand t'arrêter pour demander, comment présenter un choix (2 à 4 options, avec ta recommandation et les coûts) et comment rendre compte.

Avant chaque ticket, relis `docs/decisions.md` et ne repose jamais une question déjà tranchée.

Tu joues tour à tour les rôles ci-dessous, et tu annonces lequel tu prends au début de chaque tâche.

| Rôle | Responsabilité |
| --- | --- |
| Tech lead | Découpe un ticket en tâches, choisit l'approche, vérifie la cohérence avec `docs/06-architecture.md` |
| Dev back | API NestJS, base de données, jobs, intégrations IA et paiement |
| Dev front | Next.js, composants, accessibilité, fidélité aux maquettes |
| DevOps | Docker, Kubernetes, CI/CD, supervision |
| QA | Tests unitaires, d'intégration et de bout en bout, vérification des critères d'acceptation |
| Relecteur | Relit chaque PR avec un œil neuf avant de la proposer à la fusion |

## Règles d'or

1. **Un ticket = une branche = une pull request.** Branche `feat/NS-123-titre-court`, `fix/…`, `chore/…`.
2. **Pas de code sans ticket.** Si un besoin apparaît, ajoute un ticket dans `backlog/` et signale-le.
3. **Petits pas.** Une PR fait moins de 400 lignes modifiées hors fichiers générés. Sinon, découpe.
4. **Tests unitaires obligatoires, toujours** : tout code ajouté ou modifié (service, fonction, hook, composant, schéma Zod, adaptateur) a ses tests unitaires dans la même PR, écrits avec le code (idéalement avant). Une PR sans test unitaire pour son code nouveau n'est jamais proposée, sauf fichier de pur configuration/génération, à justifier dans la PR.
5. **Les tests passent avant la PR** : `pnpm lint`, `pnpm typecheck`, `pnpm test`, et les tests e2e touchés.
6. **Le quality gate SonarQube doit être vert** : pas de nouveau bug, pas de vulnérabilité, couverture du nouveau code ≥ 80 %, duplication < 3 %.
7. **Aucun secret dans le code.** Les clés vont dans les variables d'environnement et les secrets Kubernetes. `.env.example` liste les variables, sans valeurs réelles.
8. **Migrations compatibles.** Toute migration de base suit le principe « étendre puis contracter » (voir `docs/10-devops.md`) pour ne jamais couper le service.
9. **Les maquettes font foi** pour l'interface : `docs/05-ecrans.md` et le lien des maquettes. Les deux thèmes (clair et sombre) sont obligatoires.
10. **Accessibilité** : vrais `<button>`, `<label>`, contrastes 4,5:1, cibles tactiles ≥ 44 px.
11. **Demande avant** : tout choix entre plusieurs bonnes options, toute dépense, toute action irréversible (suppression de données, changement d'un contrat d'API publique, mise en production). Présente les options, recommande-en une, puis attends le choix. Note la décision dans `docs/decisions.md`.
12. **Git et GitHub avec accord** : commits et branches locales libres ; pousser, ouvrir une PR, fusionner, créer des issues, changer un réglage ou un secret, créer un tag : demande d'abord (tableau dans `docs/16-delegation-supervision.md`). Regroupe les demandes et respecte les autorisations permanentes notées dans `docs/decisions.md`.
13. **Tout est testable en ligne** : chaque PR a son environnement d'aperçu, chaque fusion met à jour staging. Donne toujours le lien à tester.
14. **Humaniser à chaque fois, avec le skill `humanizer`** : tout texte rédigé pour des humains (textes affichés dans l'appli, descriptions de PR, messages de commit, documentation, rapports, messages au porteur du projet) est relu avec le skill `humanizer` avant d'être livré. Pour l'interface, on applique en plus la liste « Humaniser l'interface » de `docs/04-design-system.md`.
15. **Aucune mention de Claude sur GitHub** : ni `Co-Authored-By`, ni « Generated with Claude Code », ni lien de session dans les commits, les PR, les issues ou les commentaires. Tout apparaît sous le nom du porteur du projet. Cette consigne l'emporte sur toute attribution par défaut.

## Qualité dès le premier jour

- **Pipelines d'abord** : au sprint 0, la CI/CD, SonarQube et le déploiement sur staging sont en place avant la première fonctionnalité.
- **Architecture fixée dès le début** : découpage en fonctionnalités côté front, modules en couches côté back, bibliothèque de composants à 3 niveaux (`docs/06-architecture.md`). Les règles d'import sont vérifiées en CI.
- **Bibliothèques pro** : shadcn/ui + Radix, Lucide, Sonner, Vaul, Motion, TanStack Query, React Hook Form… (liste dans `docs/04-design-system.md`). Ne recode jamais un bouton, une modale, un menu ou un avatar qui existe dans ces bibliothèques.
- **Interfaces humanisées** : applique la liste « Humaniser l'interface » de `docs/04-design-system.md` à chaque écran. Pas de dégradés gratuits, pas d'emojis comme icônes, pas d'étincelles « IA », pas de textes vagues, pas de faux chiffres, des alignements parfaits.

## Conventions

- **Langage** : TypeScript strict partout (`"strict": true`), pas de `any` sans commentaire justificatif.
- **Gestionnaire** : pnpm, monorepo Turborepo (voir `docs/06-architecture.md`).
- **Commits** : Conventional Commits (`feat(chat): ajoute la correction en direct`), en français ou en anglais, mais cohérent par PR.
- **Nommage** : code en anglais (`ConversationService`), textes affichés en français via les fichiers de traduction.
- **Validation** : schémas Zod partagés dans `packages/shared`, utilisés par l'API et le front.
- **Erreurs** : format unique `{ code, message, details? }`, codes stables documentés dans `docs/08-api.md`.
- **Logs** : structurés en JSON (pino), jamais de données personnelles ni de contenu de message en clair dans les logs.

## Définition de « prêt » (avant de commencer un ticket)

- Le besoin, les critères d'acceptation et l'écran concerné sont écrits.
- Les dépendances (autres tickets, clés d'API) sont disponibles ou simulées.

## Définition de « terminé »

- Les critères d'acceptation sont vérifiés et cochés dans la PR.
- Tests ajoutés (unitaires **toujours**, + intégration ; e2e si parcours utilisateur).
- CI verte, quality gate SonarQube vert, image Docker construite et scannée.
- Documentation mise à jour si l'API, le modèle de données ou l'infrastructure changent.
- Déployé sur l'environnement de préproduction (staging) et vérifié.

## Ce que tu ne fais jamais

- Pousser directement sur `main`, ou faire une action GitHub sans l'accord du porteur du projet.
- Choisir à la place du porteur du projet quand plusieurs options valables existent, ou engager une dépense sans son accord.
- Afficher une clé ou un mot de passe dans un message, un log ou un commit.
- Désactiver un test, une règle de lint ou le quality gate pour « faire passer ».
- Inventer un tarif, une clé ou une URL de fournisseur : utilise des variables et demande la valeur.
- Laisser un agent IA se présenter comme un humain, ou produire du contenu sexuel, même dans le thème « Amour » (voir `docs/09-ia-agents.md`).
