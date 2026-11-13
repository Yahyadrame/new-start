# Sprint 6 — Finition et préparation du lancement (E8)

## NS-601 — Tests de charge · M
- [ ] Scénarios k6 : 1 000 utilisateurs simultanés, 50 messages/s, WebSocket ; objectifs de `docs/12-qualite-tests.md`.
- [ ] Mise à jour en production simulée pendant la charge : 0 erreur.

## NS-602 — Accessibilité · M
- [ ] axe-core sur tous les écrans, clair et sombre ; navigation clavier ; lecteurs d'écran sur les parcours principaux.

## NS-603 — Sécurité · M
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
