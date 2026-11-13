# 14 — Paiements et abonnements

> **Statut au lancement : développé mais désactivé.** Toute l'appli est gratuite au début. Le module de paiement est construit et testé en mode bac à sable, derrière le drapeau `payments.enabled = false`. L'écran Abonnement affiche « Bientôt ». L'activation se fera sur décision du porteur du projet, une fois les comptes marchands ouverts.

## Offres (prix proposés, à valider avec les 100 premiers utilisateurs)

| Code | Offre | Afrique de l'Ouest (XOF) | Reste du monde (USD) | Contenu |
| --- | --- | --- | --- | --- |
| `FREE` | Gratuit | 0 | 0 | 1 épisode/jour, jeux de base, 10 messages IA/jour, révisions |
| `WEEK_PASS` | Pass semaine | 500 / 7 jours | 1,99 / 7 jours | Tout Plus pendant 7 jours, sans renouvellement automatique |
| `PLUS_MONTHLY` | Plus mensuel | 2 000 / mois | 5,99 / mois | Messages illimités, notes vocales, tous les jeux et séries, carnet |
| `PLUS_YEARLY` | Plus annuel | 15 000 / an | 39,99 / an | Idem Plus |
| `PRO_MONTHLY` | Pro mensuel | 4 000 / mois | 11,99 / mois | Plus + appels vocaux (60 min/jour), IELTS/TOEFL, parcours bourses |

Les prix et les pays sont stockés en base (table `Plan` + `PlanPrice` par devise), jamais en dur dans le code. La devise dépend du pays de l'utilisateur (`countryCode`).

Repères concurrents relevés à l'automne 2026 (États-Unis) : Speak Premium 17,99 $/mois, Speak Premium Plus 39,99 $/mois, Duolingo Super 9,99 à 12,99 $/mois, Babbel 13,45 $/mois (formule 6 mois).

## Moyens de paiement

| Fournisseur | Pays | Mode | Notes |
| --- | --- | --- | --- |
| Wave | Sénégal, Côte d'Ivoire, Mali, Burkina Faso… | Lien ou session de paiement, confirmation par webhook | Pas de prélèvement automatique : le renouvellement se fait par un rappel + nouveau paiement en un geste |
| Orange Money | Afrique de l'Ouest et centrale | API web payment, confirmation par webhook | Même principe de renouvellement |
| Stripe (carte) | Monde | Abonnement Stripe Billing | Renouvellement automatique, factures |
| Stores Apple / Google | V2 (applis mobiles) | Achats intégrés obligatoires pour les contenus numériques dans les applis | Synchronisation via webhooks des stores |

Avant l'intégration, vérifier pour chaque fournisseur : conditions d'accès marchand, frais, documentation à jour, environnement de test. Ces informations ne sont pas figées dans ce dossier.

## Architecture

- Interface commune `PaymentProvider` dans `packages/payments` :
  `createCheckout(plan, user) → { redirectUrl | instructions, providerRef }`, `verifyWebhook(req) → PaymentEvent`, `refund(paymentId)`.
- **Idempotence** : contrainte unique `(provider, providerTxId)` ; un webhook reçu deux fois ne crée qu'un paiement.
- **Machine d'états** de l'abonnement : `PENDING → ACTIVE → (PAST_DUE) → CANCELED | EXPIRED`.
- Pour Wave et Orange Money : 3 jours avant l'échéance, notification « Ton abonnement se termine dans 3 jours » avec bouton de paiement ; période de grâce de 3 jours en `PAST_DUE`, puis retour à `FREE` sans perte de données.
- Réconciliation quotidienne : un job compare les paiements reçus et les transactions du fournisseur, alerte en cas d'écart.

## Règles honnêtes

- Prix affiché toutes taxes comprises, dans la devise locale.
- Annulation en 2 gestes depuis le profil, effective à la fin de la période payée.
- Aucun renouvellement caché : le Pass semaine ne se renouvelle jamais tout seul.
- Remboursement possible sous 7 jours si l'offre n'a presque pas été utilisée (règle à valider).
