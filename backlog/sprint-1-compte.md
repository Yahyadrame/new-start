# Sprint 1 — Compte et premier contact (E1)

## NS-101 — Modèle de données initial · M
- [x] Schéma Prisma de `docs/07-modele-de-donnees.md` pour User, AuthIdentity, RefreshToken, Topic, Agent, Conversation, Message, Correction, Expression, Word.
- [x] Seed : import de `data/expressions.csv`, `data/mots.csv`, des thèmes et des 12 agents de `docs/03-contenu-pedagogique.md`.

## NS-102 — Connexion par code à usage unique · L
- [x] `POST /auth/otp/request` et `/verify`, canal e-mail via **Brevo** (gratuit) au lancement ; canal SMS via Brevo prêt mais désactivé tant que le porteur du projet n'a pas accordé de budget. À l'activation, un job propose aux utilisateurs existants de vérifier leur numéro. Interfaces `Mailer` et `SmsSender`, adaptateur factice en local.
- [x] Limites : 3 demandes / 10 min / numéro, 5 essais par code, code valable 5 minutes.
- [x] Jetons : accès 15 min, rafraîchissement 30 jours en cookie HttpOnly, rotation et détection de réutilisation.

## NS-103 — Connexion Google · M
- [ ] `POST /auth/google` (vérification de l'idToken), rattachement à un compte existant si même e-mail vérifié.

## NS-104 — Écran Bienvenue (1) · S
- [x] Conforme aux maquettes, clair et sombre, logo bulle N.

## NS-105 — Écran Inscription (11) · M
- [ ] Prénom (obligatoire, 2 à 30 caractères), numéro de téléphone (obligatoire, validé avec `libphonenumber-js`, enregistré en E.164, indicatif +221 par défaut, unique par compte), objectif, année de naissance, puis Google ou code par e-mail.
- [ ] Case de consentement SMS séparée et décochée par défaut (`smsOptIn`) ; le numéro reste « non vérifié » jusqu'à l'activation des SMS.
- [ ] Consentement aux conditions ; consentement séparé pour les enregistrements vocaux.

## NS-106 — Test de niveau (2) · L
*Découpé le 2026-11-17 en cinq PR : (1) garde d'accès aux routes protégées, (2) API du test (questions fixes, estimation par le LLM, `User.level`), (3) écrans à l'écrit, (4) API de la voix (consentement et transcription), (5) micro dans l'écran du test.*
- [ ] 5 questions posées par Jade, réponses à l'oral (STT) ou à l'écrit. *API faite (PR 2), écrans à l'écrit faits (PR 3) ; API de la voix faite (PR 4 : consentement et transcription) ; feuille de consentement, micro et « Écrire plutôt » à venir (PR 5).*
- [x] Le LLM estime le niveau CECR avec une justification courte ; résultat enregistré sur `User.level`. *Fait côté API (PR 2). Le modèle « plus puissant » n'est pas encore choisissable : `LlmRequest` n'a pas de champ modèle, le modèle par défaut du fournisseur est utilisé.*
- [x] Écran de résultat : niveau, 3 points forts, 3 points à travailler, bouton « Commencer ». *« Commencer » renvoie à `/` tant que Discussions (NS-108) n'existe pas.*

## NS-107 — Profil et réglages (16) · M
- [ ] `GET/PATCH /me` ; thème Système/Clair/Sombre appliqué immédiatement ; rappel, objectif quotidien, accent, économie de données, mode pause.
- [ ] Export et suppression du compte.

## NS-108 — Premier message de Jade · S
- [ ] À la fin de l'inscription, la conversation avec Jade est créée avec son premier message, visible dans Discussions.

## NS-109 — Tests e2e Playwright dans la CI · M
*Ajouté le 2026-11-15 : `e2e.yml` était prévu au sprint 0, mais il n'y avait aucun parcours à tester.*
- [ ] `e2e.yml` : chaque PR qui touche l'interface lance Playwright (mobile et ordinateur, thème clair et sombre) avec l'accessibilité axe, contre l'aperçu Vercel de la PR.
- [ ] Un premier parcours : Bienvenue puis Inscription (NS-104, NS-105).
- [ ] `pnpm test:e2e` en local avec un seul navigateur ; test unitaire de la configuration.

## NS-110 — L'API utilise `packages/shared` · M
*Ajouté le 2026-11-16 : le schéma d'inscription existe en double (`apps/api/.../signup-profile.ts` et `packages/shared`), choix B de la décision du jour.*
- [x] `packages/shared` est compilé (sortie `dist`, `exports` vers la sortie) et l'API l'importe à la place de `signup-profile.ts`, qui disparaît avec son test.
- [x] Dockerfile de l'API, `pnpm deploy --prod` et déploiement Render vérifiés sur staging (même santé, même image dans la limite de taille).
- [ ] Les schémas de réponse (session, utilisateur) rejoignent `packages/shared`.

## NS-111 — Écran du code de vérification · M
*Ajouté le 2026-11-16 : NS-105 envoie le code puis renvoie vers `/signup/code`, qui n'existe pas encore.*
- [x] `/signup/code` : six chiffres, renvoi du code après un délai, retour à l'inscription ; l'e-mail vient d'un stockage de session, jamais de l'adresse.
- [x] Appel de `/api/auth/otp/verify`, puis ouverture de la session (jeton en mémoire, cookie de rafraîchissement) et passage au test de niveau (NS-106).
- [x] Erreurs lisibles : code faux, expiré, trop d'essais ; accessibilité clavier et lecteur d'écran.

## NS-112 — Formulaire d'inscription : indicatif téléphonique et année de naissance · M
*Ajouté le 2026-11-17 : le porteur veut choisir au lieu de taper (retour du test réel d'inscription). Choix A validé : `Command` shadcn/Radix + liste de pays de `libphonenumber-js`.*
- [x] Champ téléphone : sélecteur de pays (drapeau en image, nom, indicatif), recherche par nom ou indicatif, Sénégal (+221) par défaut ; le numéro saisi reste validé en E.164 par le schéma partagé.
- [x] Année de naissance : liste à choisir (de l'année courante moins 100 ans à l'année courante moins 13 ans), plus de saisie libre.
- [x] Clavier, lecteur d'écran, cibles ≥ 44 px, thèmes clair et sombre ; textes via `fr.json`. *(thème sombre vu à l’écran ; clair à vérifier sur l’aperçu)*
- [x] Tests unitaires du formulaire et du sélecteur.

## NS-113 — Journaliser la cause d'un échec d'envoi du code · S
*Ajouté le 2026-11-17 : `POST /auth/otp/request` renvoie 503 sans cause dans les logs (le blocage d'IP de Brevo est resté invisible).*
- [x] `RequestOtp` journalise (pino) le canal et le statut renvoyé par Brevo quand l'envoi échoue, sans adresse e-mail, sans numéro et sans code.
- [x] Test unitaire : l'erreur est journalisée et le 503 `DELIVERY_FAILED` reste inchangé.

## NS-114 — Retrouver la session au rechargement · M
*Ajouté le 2026-11-17 : le jeton d'accès vit en mémoire ; recharger `/onboarding/level` renvoie vers `/signup`, où le même e-mail donne un conflit.*
- [ ] Au chargement, `POST /api/auth/refresh` (cookie) rouvre la session avant de décider d'une redirection ; test unitaire.
- [ ] Sans cookie valable, renvoi vers l'accueil ; le renouvellement du jeton avant ses 15 minutes est traité dans la même PR.
