# Sprint 1 — Compte et premier contact (E1)

## NS-101 — Modèle de données initial · M
- [ ] Schéma Prisma de `docs/07-modele-de-donnees.md` pour User, AuthIdentity, RefreshToken, Topic, Agent, Conversation, Message, Correction, Expression, Word.
- [ ] Seed : import de `data/expressions.csv`, `data/mots.csv`, des thèmes et des 12 agents de `docs/03-contenu-pedagogique.md`.

## NS-102 — Connexion par code à usage unique · L
- [ ] `POST /auth/otp/request` et `/verify`, canal e-mail via **Brevo** (gratuit) au lancement ; canal SMS via Brevo prêt mais désactivé tant que le porteur du projet n'a pas accordé de budget. À l'activation, un job propose aux utilisateurs existants de vérifier leur numéro. Interfaces `Mailer` et `SmsSender`, adaptateur factice en local.
- [ ] Limites : 3 demandes / 10 min / numéro, 5 essais par code, code valable 5 minutes.
- [ ] Jetons : accès 15 min, rafraîchissement 30 jours en cookie HttpOnly, rotation et détection de réutilisation.

## NS-103 — Connexion Google · M
- [ ] `POST /auth/google` (vérification de l'idToken), rattachement à un compte existant si même e-mail vérifié.

## NS-104 — Écran Bienvenue (1) · S
- [ ] Conforme aux maquettes, clair et sombre, logo bulle N.

## NS-105 — Écran Inscription (11) · M
- [ ] Prénom (obligatoire, 2 à 30 caractères), numéro de téléphone (obligatoire, validé avec `libphonenumber-js`, enregistré en E.164, indicatif +221 par défaut, unique par compte), objectif, année de naissance, puis Google ou code par e-mail.
- [ ] Case de consentement SMS séparée et décochée par défaut (`smsOptIn`) ; le numéro reste « non vérifié » jusqu'à l'activation des SMS.
- [ ] Consentement aux conditions ; consentement séparé pour les enregistrements vocaux.

## NS-106 — Test de niveau (2) · L
- [ ] 5 questions posées par Jade, réponses à l'oral (STT) ou à l'écrit.
- [ ] Le LLM (modèle « évaluation ») estime le niveau CECR avec une justification courte ; résultat enregistré sur `User.level`.
- [ ] Écran de résultat : niveau, 3 points forts, 3 points à travailler, bouton « Commencer ».

## NS-107 — Profil et réglages (16) · M
- [ ] `GET/PATCH /me` ; thème Système/Clair/Sombre appliqué immédiatement ; rappel, objectif quotidien, accent, économie de données, mode pause.
- [ ] Export et suppression du compte.

## NS-108 — Premier message de Jade · S
- [ ] À la fin de l'inscription, la conversation avec Jade est créée avec son premier message, visible dans Discussions.
