# 16 — Délégation et supervision

Claude Code réalise **tout** le travail : code, tests, infrastructure, déploiement. Pour Git et GitHub, il prépare tout mais **n'agit qu'avec l'accord** du porteur du projet (voir plus bas). Le porteur du projet **supervise** : il choisit entre les options proposées, valide les livraisons et teste en temps réel sur l'environnement en ligne.

## Qui fait quoi

| Sujet | Claude Code | Porteur du projet |
| --- | --- | --- |
| Code, tests, revue | Fait tout, de bout en bout | Regarde le résultat sur staging |
| Git et GitHub | Travaille en local (branches, commits), prépare les PR et les relit ; **demande l'accord** avant toute action sur GitHub | **Donne son accord** : pousser, ouvrir une PR, fusionner, configurer le dépôt |
| Déploiement | Met en place staging dès le sprint 0, puis un aperçu par PR ; déploie la production sur accord | Teste les liens d'aperçu et de staging |
| Choix (fournisseur, librairie, design, prix, contenu) | Propose 2 à 4 options avec une recommandation | **Choisit** |
| Dépenses | Annonce le coût avant toute création payante | **Valide** |
| Mise en production | Prépare, déroule la procédure | **Valide** chaque mise en production |

## Quand Claude Code doit s'arrêter et demander

Claude Code pose la question **avant** d'agir dans ces cas, et attend la réponse :

1. **Un choix avec plusieurs bonnes options** : fournisseur (IA, SMS, hébergement, paiement), librairie structurante, nom de domaine, design non prévu dans les maquettes, texte visible important.
2. **Une dépense** : tout service payant, toute hausse de capacité, tout passage d'une offre gratuite à une offre payante, toute ressource créée sur AWS.
3. **Une action irréversible** : suppression de données, migration destructive, changement d'un contrat d'API publique, mise en production.
4. **Une contradiction** entre les documents, ou un besoin absent de la documentation.
5. **Un accès manquant** : clé d'API, compte fournisseur, droit sur l'organisation GitHub.

Dans tous les autres cas, il avance seul et rend compte.

## Format d'une question de choix

Dans Claude Code, utiliser l'outil de questions à choix (AskUserQuestion) quand il est disponible ; sinon, ce format en texte :

```markdown
### Choix à faire : <sujet>

**Contexte** : <pourquoi on doit choisir maintenant, en 2 phrases>

| Option | Avantages | Inconvénients | Coût | Effort |
| --- | --- | --- | --- | --- |
| A. … (recommandée) | … | … | … €/mois | S/M/L |
| B. … | … | … | … | … |
| C. … | … | … | … | … |

**Ma recommandation** : A, parce que …
**Si tu ne réponds pas** : je continue sur les autres tickets ; ce ticket reste en attente.
```

Règles : options réellement différentes, coûts chiffrés quand ils existent (avec la source et la date), une seule question par sujet, questions groupées si plusieurs se présentent.

## Journal des décisions

Chaque réponse du porteur du projet est consignée dans `docs/decisions.md` (date, question, option choisie, raison). Claude Code relit ce journal avant chaque ticket et ne repose jamais une question déjà tranchée.

```markdown
| Date | Sujet | Décision | Raison |
| --- | --- | --- | --- |
| 2026-11-14 | Hébergeur Kubernetes | Option B | Moins cher, datacenter proche |
```

## Validation des livraisons

| Moment | Ce que Claude Code fournit | Ce que le porteur du projet fait |
| --- | --- | --- |
| Fin de chaque ticket | Message court : lien de la PR, lien d'aperçu ou de staging, capture clair et sombre, ce qui a changé | Teste s'il le souhaite ; signale un problème en une phrase |
| Fin de sprint (démo) | Liste des tickets livrés, liens à tester, chiffres (tests, couverture, quality gate), points ouverts, plan du sprint suivant | **Valide** le sprint ou demande des ajustements |
| Avant la production | Notes de version, résultat des tests de fumée sur staging, plan de retour arrière | **Valide** la mise en production |

Une remarque du porteur du projet devient un ticket `fix/` ou `feat/` prioritaire.

## Git et GitHub : rien sans l'accord du porteur du projet

| Action | Règle |
| --- | --- |
| Créer une branche locale, faire des commits locaux | Libre |
| Pousser une branche sur GitHub | **Accord demandé** |
| Ouvrir, modifier ou fermer une pull request | **Accord demandé** |
| Fusionner une PR dans `main` | **Accord demandé, à chaque fois**, après CI verte et quality gate vert |
| Créer le dépôt, changer ses réglages, la protection de `main`, les droits | **Accord demandé** |
| Créer ou modifier des issues, étiquettes, tableau Projects | **Accord demandé** (une fois pour un lot, par exemple « créer les 50 issues du backlog ») |
| Ajouter ou changer un secret GitHub | **Accord demandé** ; la valeur est saisie par le porteur du projet lui-même |
| Créer un tag ou une release | **Accord demandé** |
| Supprimer une branche distante, réécrire l'historique (`push --force`, `rebase` d'une branche partagée) | Interdit sans accord explicite et motivé |

Comment demander, pour ne pas multiplier les messages :

- Claude Code regroupe les demandes : par exemple, à la fin d'un ticket, « Je pousse la branche `feat/NS-204-conversation` et j'ouvre la PR #12 ? » ; puis, quand la CI est verte, « La PR #12 est verte (tests, SonarQube, aperçu : <lien>). Je fusionne ? ».
- Il précise toujours ce qui va changer : branche, fichiers principaux, lien d'aperçu, résultat de la CI.
- Le porteur du projet peut accorder une **autorisation permanente** pour un type d'action (par exemple « tu peux pousser et ouvrir les PR sans me demander ; demande seulement pour fusionner »). Claude Code la note dans `docs/decisions.md` et la respecte jusqu'à nouvel ordre.
- Protection de `main` : PR obligatoire, CI verte, quality gate SonarQube vert, et **approbation du porteur du projet** (GitHub l'exige pour fusionner).

## Déploiement dès le début

- **En local et en ligne** : le porteur du projet teste en local comme d'habitude, dans Docker (`docker compose --profile dev up`, voir `docs/10-devops.md`), et en ligne sur les liens d'aperçu et de staging. Chaque PR indique les deux façons de tester : commandes locales et lien en ligne. Le déploiement et les traitements lourds restent en ligne.
- **Sprint 0** : staging en ligne dès le premier jour utile (front `*.vercel.app`, API `*.onrender.com`). Chaque fusion sur `main` met à jour staging en quelques minutes.
- **Dès le sprint 1** : un **aperçu par PR** (lien Vercel de la PR, base Neon de la PR), commenté automatiquement dans la PR, supprimé à la fermeture. Le porteur du projet teste chaque fonctionnalité avant qu'elle soit fusionnée.
- Prévenir le porteur du projet que le premier chargement peut prendre environ une minute quand l'API gratuite était en veille.
- **Phase 2** : quand l'aperçu est validé, Claude Code présente le comparatif VPS / AWS (coût mensuel, coût après épuisement des crédits AWS, latence depuis Dakar, travail d'administration) et attend son choix. Aucune ressource AWS créée sans son accord ni sans alerte de budget.
- Données de démonstration chargées automatiquement sur staging et sur les aperçus (comptes de test, conversations, épisodes).
- Paiements et SMS en **mode test** sur staging et sur les aperçus, jamais de vrai débit.

## Rapport hebdomadaire

Chaque vendredi, Claude Code écrit `docs/rapports/AAAA-Sxx.md` : ce qui est livré, ce qui reste, les décisions en attente, le coût d'infrastructure et d'IA de la semaine, les risques.
