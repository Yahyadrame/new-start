# 12 — Qualité et tests

## Pyramide de tests

| Niveau | Outil | Ce qu'on teste | Seuil |
| --- | --- | --- | --- |
| Unitaires | Vitest | Services, calculs (XP, série de jours, FSRS, quotas, prix), composants | Couverture du nouveau code ≥ 80 % |
| Intégration | Vitest + Testcontainers (PostgreSQL, Redis) | Routes API, repository Prisma, jobs BullMQ, webhooks | Chaque route a au moins un cas nominal et un cas d'erreur |
| Contrat | Schémas Zod partagés + tests OpenAPI | Le front et l'API parlent le même format | Échec si un champ change sans version |
| Bout en bout | Playwright (mobile 390 px et ordinateur, clair et sombre) | Parcours : inscription → test → conversation → jeu → abonnement | Parcours critiques verts avant chaque mise en production |
| Accessibilité | axe-core dans Playwright | Contrastes, libellés, navigation clavier | 0 violation « serious » ou « critical » |
| Visuel | Captures Playwright comparées | Écrans clés dans les deux thèmes | Écart > 0,1 % à valider à la main |
| Charge | k6 | 1 000 utilisateurs simultanés, 50 messages/s, WebSocket | p95 < 300 ms hors IA, 0 % d'erreur |
| IA | Jeux d'évaluation `packages/ai/evals` | Corrections justes, sécurité, format JSON | Voir `09-ia-agents.md` |

Les fournisseurs externes (IA, SMS, paiement) sont **simulés** dans les tests unitaires et d'intégration (adaptateurs factices). Un test de bout en bout quotidien tourne sur staging avec les vrais fournisseurs en mode test.

## Revue de code

- Toute PR est relue (rôle « Relecteur » dans `CLAUDE.md`, puis validation du porteur du projet pour les choix produit).
- Liste de contrôle de la PR (`.github/pull_request_template.md`) :

```markdown
## Ticket
NS-___

## Ce qui change
-

## Captures (si interface) — clair et sombre

## Vérifications
- [ ] Critères d'acceptation cochés
- [ ] Tests ajoutés ou mis à jour
- [ ] Lint, typecheck et tests verts en local
- [ ] Pas de secret ni de donnée personnelle dans le code ou les logs
- [ ] Migration compatible (étendre puis contracter), si base modifiée
- [ ] Documentation mise à jour (API, données, infra)
- [ ] Accessibilité vérifiée (clavier, contrastes, libellés)
- [ ] Composants issus de `packages/ui` (shadcn/Radix), icônes Lucide uniquement
- [ ] Liste « Humaniser l'interface » vérifiée (pas de dégradés gratuits, d'emojis-icônes, de textes vagues, d'alignements approximatifs)
- [ ] Règles d'import entre couches respectées (CI verte)
```

## Outils de qualité

- ESLint (règles TypeScript strictes, `eslint-plugin-security`), Prettier, `tsc --noEmit`.
- Husky + lint-staged : lint et format avant chaque commit.
- Commitlint : Conventional Commits.
- SonarQube : quality gate bloquant (voir `10-devops.md`).

## Gestion des bugs

| Gravité | Exemple | Délai de correction |
| --- | --- | --- |
| Critique | Service indisponible, fuite de données, paiement débité sans accès | Immédiat, correctif en production |
| Majeure | Une fonctionnalité principale ne marche pas pour une partie des utilisateurs | Dans le sprint en cours |
| Mineure | Défaut visuel, texte erroné | Sprint suivant |

Chaque bug corrigé reçoit un test qui l'aurait détecté.
