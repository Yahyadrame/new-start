# 15 — Processus d'équipe

## Rôles

| Rôle | Qui | Responsabilité |
| --- | --- | --- |
| Product Owner (superviseur) | Porteur du projet | Choisit entre les options proposées, valide chaque sprint et chaque mise en production, teste en ligne |
| Équipe de développement | Claude Code, en rôles successifs (tech lead, dev back, dev front, DevOps, QA, relecteur) | Réalise tout le travail selon `CLAUDE.md` et `16-delegation-supervision.md` ; demande l'accord avant chaque action GitHub |
| Testeurs bêta | 20 à 50 utilisateurs | Retours sur l'usage réel |

## Cadence : sprints d'une semaine

| Moment | Durée | Contenu |
| --- | --- | --- |
| Planification (lundi) | 30 min | Choisir les tickets du sprint dans `backlog/`, vérifier la définition de « prêt » |
| Point quotidien | 5 min | Fait hier, prévu aujourd'hui, blocages (écrit dans `docs/journal/AAAA-MM-JJ.md`) |
| Démo (vendredi) | 30 min | Montrer ce qui tourne sur staging, valider ou demander des ajustements |
| Rétrospective (vendredi) | 15 min | Ce qui a marché, ce qu'on change, une action |

## Git

- Branche principale `main`, toujours déployable, protégée : PR obligatoire, CI verte, quality gate vert. Claude Code relit, puis fusionne seulement avec l'accord et l'approbation GitHub du porteur du projet (voir `16-delegation-supervision.md`).
- Développement en branches courtes (< 2 jours) depuis `main` : `feat/NS-123-…`, `fix/NS-…`, `chore/…`, `docs/…`.
- Fusion par « squash » ; le titre de la PR devient le commit (Conventional Commits).
- Versions sémantiques `vMAJEUR.MINEUR.CORRECTIF`, notes de version générées automatiquement.
- Correctif urgent : branche `hotfix/…` depuis le tag en production, puis fusion dans `main`.

## Tickets

Format d'un ticket (`backlog/NS-123.md` ou outil de gestion choisi) :

```markdown
# NS-123 — Titre court

**Épopée** : E2 Messagerie · **Estimation** : S / M / L · **Écran** : 4 Conversation

## Besoin
En tant que <utilisateur>, je veux <action> afin de <bénéfice>.

## Critères d'acceptation
- [ ] Étant donné …, quand …, alors …

## Notes techniques

## Hors périmètre
```

Estimation : S = moins d'une demi-journée, M = une journée, L = deux jours (au-delà, découper).

## Décisions d'architecture

Toute décision structurante (choix d'un fournisseur, d'une librairie, d'un découpage) est écrite dans `docs/adr/NNNN-titre.md` : contexte, options étudiées, décision, conséquences. On ne revient pas sur une décision sans nouvel ADR.

## Communication avec le porteur du projet

Voir `16-delegation-supervision.md` : format des questions de choix, journal `docs/decisions.md`, message de fin de ticket avec lien d'aperçu, démo de fin de sprint, rapport hebdomadaire.
