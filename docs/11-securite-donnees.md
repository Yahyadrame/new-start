# 11 — Sécurité et données personnelles

Je ne suis pas juriste : les points de conformité ci-dessous sont à faire valider par un professionnel avant le lancement.

## Authentification

- Connexion par Google, ou par code à usage unique envoyé par e-mail via Brevo (gratuit), ou par SMS via Brevo une fois le budget accordé (code à 6 chiffres, valable 5 minutes, 5 essais maximum).
- Jeton d'accès JWT de 15 minutes signé en ES256 ; jeton de rafraîchissement opaque de 30 jours, **haché** en base, rotation à chaque usage, détection de réutilisation (révocation de toute la famille).
- Protection contre l'abus des SMS : limite par numéro et par IP, captcha invisible après 2 demandes, liste des indicatifs autorisés.

## Protection de l'application

- OWASP ASVS niveau 2 comme référence ; revue des points sensibles SonarQube à chaque PR.
- Validation Zod de toutes les entrées ; requêtes Prisma paramétrées (pas de SQL brut non contrôlé).
- En-têtes : HSTS, CSP stricte, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (micro et caméra seulement sur les écrans qui en ont besoin).
- CORS limité aux domaines de l'appli.
- Téléversements : signatures Cloudinary de courte durée, type et taille vérifiés (audio ≤ 10 Mo, ≤ 2 minutes), dossiers privés pour l'audio des utilisateurs.
- Sous-traitants à déclarer dans la politique de confidentialité : Brevo (e-mails, SMS), Cloudinary (médias), fournisseurs d'IA, hébergeur, Sentry.
- Webhooks de paiement : signature vérifiée, horodatage contrôlé, traitement idempotent.
- Dépendances : Renovate + `pnpm audit` en CI ; images scannées par Trivy.
- Tests d'intrusion légers avant le lancement public (OWASP ZAP en CI sur staging).

## Données personnelles

| Donnée | Usage | Conservation |
| --- | --- | --- |
| Numéro de téléphone | Demandé à l'inscription ; servira aux SMS (code de connexion, rappels) une fois activés, seulement avec le consentement SMS | Durée du compte |
| Adresse e-mail (Google ou saisie) | Connexion, e-mails transactionnels | Durée du compte |
| Prénom, objectif, niveau, année de naissance | Personnalisation, restriction des thèmes adultes | Durée du compte |
| Messages et corrections | Conversation, progrès | Durée du compte (supprimables) |
| Enregistrements vocaux | Transcription, prononciation | 30 jours, puis seule la transcription reste |
| Paiements | Facturation | Durée légale de conservation comptable, sans numéro de carte (géré par le prestataire) |

Principes :

- **Consentement explicite** avant tout enregistrement vocal ; écran dédié qui explique l'usage.
- Les messages envoyés au fournisseur d'IA ne servent pas à l'entraînement de ses modèles (option à vérifier et activer dans le contrat de chaque fournisseur).
- Export et suppression du compte en libre-service (`/me/export`, `DELETE /me`), effectifs sous 30 jours y compris dans les sauvegardes.
- Chiffrement en transit (TLS 1.2+) et au repos (base, stockage objet).
- Accès administrateur nominatif, avec double authentification et journal d'audit.

## Conformité à vérifier

- **Sénégal** : loi n° 2008-12 sur la protection des données à caractère personnel ; déclaration ou demande d'autorisation auprès de la Commission de Protection des Données Personnelles (CDP).
- **Union européenne** : RGPD dès qu'on vise des utilisateurs européens (registre des traitements, base légale, transferts hors UE encadrés).
- **Autres pays de la zone** : vérifier la loi locale à chaque ouverture de marché.
- **Stores** (V2) : règles d'Apple et Google sur l'IA générative, le signalement de contenu, les achats intégrés.
- **Mineurs** : âge minimum à fixer (13 ans recommandé) ; thème Amour réservé aux majeurs ; pas de publicité ciblée.

## Plan de réponse à incident

1. Détection (alerte, signalement).
2. Confinement (révocation de clés, désactivation d'un drapeau, blocage d'IP).
3. Analyse et correction.
4. Notification des personnes concernées et de l'autorité dans les délais légaux si des données personnelles sont touchées.
5. Rapport après incident, sans recherche de coupable, avec actions de prévention.
