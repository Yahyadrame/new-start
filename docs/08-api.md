# 08 — API

- Base : `https://api.newstart.app/v1` (nom de domaine à confirmer). Versionnée par le chemin.
- Format : JSON, dates ISO 8601 UTC, montants en unité mineure + devise.
- Authentification : `Authorization: Bearer <accessToken>` ; le jeton de rafraîchissement est dans un cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Documentation générée : OpenAPI (Swagger) sur `/v1/docs` en staging uniquement.
- Erreurs : `{ "code": "QUOTA_EXCEEDED", "message": "…", "details": { … } }`.

## Routes REST (MVP)

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/auth/otp/request` | Envoie un code `{ channel: "email" \| "sms", destination, signup? }` via Brevo (`signup` : profil d'inscription gardé avec le code, le compte n'est créé qu'à la vérification ; réponse `{ expiresInSeconds }`, identique que le compte existe ou non) (SMS désactivé au lancement ; limité : 3 / 10 min / destination) |
| POST | `/auth/otp/verify` | Vérifie `{ channel, destination, code }`. Crée le compte à la première vérification (avec le `signup` gardé). Renvoie `{ accessToken, expiresInSeconds, user }` ; le jeton de rafraîchissement part dans le cookie `ns_refresh`, jamais dans le corps |
| POST | `/auth/google` | Échange un `idToken` Google contre les jetons |
| POST | `/auth/refresh` | Lit le cookie `ns_refresh`, renvoie `{ accessToken, expiresInSeconds, user }` et pose un nouveau cookie (rotation). Un jeton déjà utilisé révoque toute la famille |
| POST | `/auth/logout` | Révoque la famille du jeton, efface le cookie, répond 204 |
| GET / PATCH | `/me` | Jeton d'accès exigé. `GET` renvoie `{ id, firstName, goal, level, theme, reminderTime, timezone, dailyGoalMin, preferredAccent, dataSaver, pausedUntil }`. `PATCH` prend une ou plusieurs de ces clés (sauf `id`, `level` et `timezone`) : `firstName` (2 à 30 caractères), `goal`, `theme` (`SYSTEM`, `LIGHT`, `DARK`), `reminderTime` (`HH:MM` ou `null`), `dailyGoalMin` (5 à 120), `preferredAccent` (`en-US`, `en-GB`, `en-NG`), `dataSaver`, `pausedUntil` (date ISO future ou `null`). Renvoie le profil à jour. Corps vide ou clé inconnue : 400 `VALIDATION_FAILED` ; compte disparu : 404 `ACCOUNT_NOT_FOUND` |
| DELETE | `/me` | Jeton d'accès exigé. Supprime le compte, ses identités, ses jetons, ses réponses au test, ses conversations (messages et corrections) et les codes à usage unique de ses adresses, dans une seule transaction. Répond 204 ; les sauvegardes expirent seules sous 30 jours. Le jeton d'accès reste valable jusqu'à son expiration (15 min) mais `/me` répond alors 404 `ACCOUNT_NOT_FOUND`, et le cookie de rafraîchissement ne sert plus (401) |
| GET | `/me/export` | Jeton d'accès exigé. JSON : `exportedAt`, le profil et les réglages, `identities` (fournisseur, adresse ou numéro, date de vérification), `levelAnswers`, `conversations` (contact, messages avec traduction et correction). Sans identifiant interne ni jeton |
| POST | `/onboarding/level-test/answer` | Jeton d'accès exigé. Envoie `{ position, text }` (position 1 à 5, texte de 1 à 1000 caractères ; les 5 questions fixes sont dans `packages/shared`). Réponses 1 à 4 : `{ done: false, next }`. Réponse 5 : le LLM estime le niveau, qui est enregistré sur `User.level` ; la conversation avec Jade est créée avec son premier message (une seule fois), et la réponse est `{ done: true, level, justification, strengths[3], weaknesses[3] }` (textes en français). Refaire le test réécrit les réponses |
| GET · PUT | `/onboarding/voice-consent` | Jeton d'accès exigé. `GET` renvoie `{ accepted }`. `PUT { accepted }` enregistre (204) ou retire le consentement aux enregistrements vocaux ; la date du premier accord est gardée sur `User.voiceConsentAt` |
| POST | `/onboarding/level-test/transcribe` | Jeton d'accès exigé. Corps : l'audio en octets bruts, `Content-Type: audio/*`, 1 Mo au plus (413 au-delà). Renvoie `{ text }` transcrit par le STT. L'audio n'est pas conservé. Sans consentement : 403 `VOICE_CONSENT_REQUIRED`. Audio vide : 400. STT absent ou en échec : 503 `AI_UNAVAILABLE` (l'écran propose d'écrire) |
| GET | `/topics` | Thèmes dans l'ordre d'affichage, avec le nombre de contacts actifs ; Amour est absent pour une personne mineure ou sans année de naissance |
| GET | `/agents?topic=&q=` | Catalogue des contacts actifs, triés par prénom ; `q` cherche dans le prénom, le rôle et la catégorie. `403 TOPIC_ADULT_ONLY` si le thème demandé est réservé aux majeurs |
| GET | `/conversations` | Jeton d'accès exigé. Les conversations du compte, la plus récente d'abord : `id`, `agent` (`slug`, `name`, `initials`, `roleFr`, `category`), `lastMessage` (`author`, `text`, ou `null` si la conversation est vide), `lastMessageAt`, `unreadCount`. Pas de pagination au MVP (une conversation par agent, 12 au plus au lancement). |
| POST | `/conversations` | Jeton d'accès exigé. Corps `{ agentSlug }`. Démarre la conversation avec ce contact et y pose son premier message (non lu), ou rend celle qui existe déjà sans rien ajouter. Répond 201 avec la même ligne que `GET /conversations`. `404 NOT_FOUND` si le contact n'existe pas ou est éteint ; `403 TOPIC_ADULT_ONLY` s'il est réservé aux majeurs et que la personne ne l'est pas à coup sûr |
| GET | `/conversations/:id/messages?cursor=` | Jeton d'accès exigé. L'historique par pages de 30, du plus récent au plus ancien : `{ items, nextCursor }`. Chaque message a `id`, `author`, `text`, `translationFr`, `createdAt` et `correction` (`better`, `whyFr`, ou `null`). `nextCursor` (opaque) est à repasser pour lire les messages plus anciens, `null` en fin d'historique. `404 NOT_FOUND` si la conversation n'existe pas ou n'est pas à la personne ; `400 VALIDATION_FAILED` si le curseur est invalide |
| POST | `/conversations/:id/messages` | Jeton d'accès exigé. Corps `{ clientId, text }` (`clientId` : UUID tiré par le client, `text` : 1 à 2 000 caractères après retrait des espaces autour). Enregistre le message de la personne et fait remonter la conversation ; répond 201 avec le message (même forme que l'historique). Idempotent : si ce `clientId` est déjà enregistré dans la conversation, répond 200 avec le message existant, sans doublon. `404 NOT_FOUND` si la conversation n'existe pas ou n'est pas à la personne ; `400 VALIDATION_FAILED` si le corps est invalide. L'API répond avant l'agent : juste après l'enregistrement, elle demande sa réponse à l'IA dans son processus (prompt `agent.v1`, 16 derniers messages, 2 nouvelles tentatives). La réponse arrive comme un message `AGENT` dans l'historique, avec la `correction` posée sur le message de la personne (`better: null` si déjà correct) ; en cas d'échec, un message `SYSTEM` « Le message n'est pas passé. Renvoie-le. ». Un renvoi (200) ne relance pas l'agent. Envoi par HTTP et lecture de la réponse par l'historique tant que le temps réel (NS-202) n'existe pas. Limite de l'offre (`QUOTA_EXCEEDED`) : NS-208 |
| POST | `/conversations/:id/read` | Jeton d'accès exigé, sans corps. Remet `unreadCount` à 0 et date `readAt` sur les messages du contact encore non lus. 204 ; 404 `NOT_FOUND` si la conversation n'existe pas ou n'est pas à la personne. Appelable plusieurs fois sans effet de plus. |
| POST | `/messages/:id/translate` | Traduction FR d'un message d'agent (mise en cache) |
| POST | `/messages/:id/speech` | URL audio TTS du message (mise en cache) |
| POST | `/media/upload-signature` | Signature de téléversement Cloudinary pour une note vocale ou une dictée |
| POST | `/notebook` | Jeton d'accès exigé. Corps `{ messageId }` (UUID d'un message de la personne). Garde une copie de la correction « Plus naturel » : `{ id, original, better, whyFr, createdAt }`. Garder deux fois le même message rend la même entrée. 400 `VALIDATION_FAILED` si le corps est invalide ; 404 `NOT_FOUND` si le message n'est pas à la personne ou n'a pas de version « Plus naturel ». |
| GET | `/notebook` | Jeton d'accès exigé. Les entrées du carnet, la plus récente d'abord. |
| GET | `/series/:season` · GET `/episodes/:id` | Série et épisode |
| POST | `/episodes/:id/progress` | Étape terminée `{ step }` |
| GET | `/games` · POST `/games/:type/sessions` | Liste et nouvelle partie (questions générées depuis le noyau) |
| GET | `/games/:type/questions?count=10` | Questions sans état (`true-false`, `match`), réponses incluses ; 1 à 20 questions. Remplace `POST /games/:type/sessions` au MVP |
| POST | `/games/sessions/:id/answers` | Réponse ; renvoie juste/faux, points, combo |
| POST | `/games/results` | Fin de partie : `{ correct }` (0 à 60), ajoute 5 XP par bonne réponse, rend `{ gained, xp }` |
| GET | `/progress` | Niveau et XP : `{ xp, level, levelXp, nextLevelXp }` (100 XP par niveau) |
| GET | `/reviews/due` · POST `/reviews/:cardId/grade` | Révisions FSRS (`again`, `hard`, `good`, `easy`) |
| POST | `/reviews/missed` | Crée une carte pour chaque expression ratée dans un jeu (`{ expressionIds }`, doublons ignorés) |
| GET | `/progress/summary` · GET `/progress/week` | Tableau de bord |
| GET | `/notifications` · POST `/notifications/read-all` | Notifications |
| POST | `/push/subscriptions` | Abonnement Web Push |
| GET | `/plans?country=SN` | Offres et prix dans la devise du pays |
| POST | `/billing/checkout` | Démarre un paiement `{ plan, provider }` ; renvoie l'URL ou les instructions |
| POST | `/billing/cancel` | Annule à la fin de la période |
| POST | `/webhooks/wave` · `/webhooks/orange-money` · `/webhooks/stripe` | Confirmations de paiement (signature vérifiée) |
| GET | `/health/live` · `/health/ready` | Sondes Kubernetes (sans authentification) |

## Événements temps réel (Socket.IO, espace `/rt`)

Connexion authentifiée par le jeton d'accès. Chaque utilisateur rejoint la salle `user:<id>`.

| Sens | Événement | Contenu |
| --- | --- | --- |
| client → serveur | `message.send` | `{ conversationId, clientId, text?, audioKey? }` |
| serveur → client | `message.ack` | `{ clientId, messageId, createdAt }` |
| serveur → client | `agent.typing` | `{ conversationId, typing: true \| false }` |
| serveur → client | `message.new` | `{ message }` |
| serveur → client | `message.correction` | `{ messageId, better \| null, whyFr \| null }` |
| serveur → client | `message.failed` | `{ clientId, code }` |
| client → serveur | `conversation.read` | `{ conversationId, upToMessageId }` |
| serveur → client | `quota.update` | `{ key, used, limit }` |

## Codes d'erreur stables

| Code | HTTP | Signification |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Données invalides (détails Zod) |
| `UNAUTHENTICATED` | 401 | Jeton absent ou expiré |
| `FORBIDDEN` | 403 | Action non autorisée |
| `TOPIC_ADULT_ONLY` | 403 | Thème réservé aux majeurs |
| `NOT_FOUND` | 404 | Ressource inconnue |
| `CONFLICT` | 409 | Doublon (ex. `clientId` déjà reçu) |
| `QUOTA_EXCEEDED` | 429 | Limite de l'offre atteinte (`details.resetAt`) |
| `RATE_LIMITED` | 429 | Trop de requêtes (et plus de 3 codes demandés en 10 minutes pour une destination) |
| `INVALID_REFRESH_TOKEN` | 401 | Cookie absent, inconnu, expiré ou déjà utilisé : se reconnecter |
| `INVALID_CODE` | 400 | Code faux, expiré, déjà utilisé ou verrouillé après 5 essais (même réponse dans tous les cas) |
| `ACCOUNT_NOT_FOUND` | 404 | Code juste, mais aucun compte et aucun profil d'inscription |
| `ACCOUNT_CONFLICT` | 409 | Numéro ou adresse déjà utilisé par un autre compte |
| `CHANNEL_UNAVAILABLE` | 400 | Canal d'envoi éteint (SMS tant que le budget n'est pas accordé) |
| `DELIVERY_FAILED` | 503 | Le code n'a pas pu être envoyé, réessayer |
| `AI_UNAVAILABLE` | 503 | Fournisseur IA indisponible, réessayer |
| `VOICE_CONSENT_REQUIRED` | 403 | Transcription demandée sans consentement aux enregistrements vocaux |
| `LEVEL_TEST_INCOMPLETE` | 409 | Cinquième réponse envoyée alors qu'une des quatre premières manque |
| `PAYMENT_FAILED` | 402 | Paiement refusé |

## Limites de débit

- Globale : 120 requêtes / minute / utilisateur ; 30 / minute / IP non authentifiée.
- Messages IA : selon l'offre (voir `02-fonctionnalites.md`), vérifiés avant l'envoi au LLM.
- En-têtes renvoyés : `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
