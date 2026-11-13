# 08 — API

- Base : `https://api.newstart.app/v1` (nom de domaine à confirmer). Versionnée par le chemin.
- Format : JSON, dates ISO 8601 UTC, montants en unité mineure + devise.
- Authentification : `Authorization: Bearer <accessToken>` ; le jeton de rafraîchissement est dans un cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Documentation générée : OpenAPI (Swagger) sur `/v1/docs` en staging uniquement.
- Erreurs : `{ "code": "QUOTA_EXCEEDED", "message": "…", "details": { … } }`.

## Routes REST (MVP)

| Méthode | Route | Rôle |
| --- | --- | --- |
| POST | `/auth/otp/request` | Envoie un code `{ channel: "email" \| "sms", destination }` via Brevo (SMS désactivé au lancement ; limité : 3 / 10 min / destination) |
| POST | `/auth/otp/verify` | Vérifie `{ destination, code }`, renvoie les jetons |
| POST | `/auth/google` | Échange un `idToken` Google contre les jetons |
| POST | `/auth/refresh` | Nouveau jeton d'accès (rotation du jeton de rafraîchissement) |
| POST | `/auth/logout` | Révoque le jeton de rafraîchissement |
| GET / PATCH | `/me` | Profil et réglages |
| DELETE | `/me` | Supprime le compte et toutes ses données |
| GET | `/me/export` | Export des données personnelles (JSON) |
| POST | `/onboarding/level-test/answer` | Envoie une réponse du test ; la dernière renvoie le niveau |
| GET | `/topics` | Thèmes et nombre de contacts |
| GET | `/agents?topic=&category=&q=` | Catalogue des contacts |
| GET | `/conversations` | Liste triée par dernier message, avec non lus |
| POST | `/conversations` | Démarre une conversation `{ agentSlug }` (idempotent) |
| GET | `/conversations/:id/messages?cursor=` | Historique paginé |
| POST | `/messages/:id/translate` | Traduction FR d'un message d'agent (mise en cache) |
| POST | `/messages/:id/speech` | URL audio TTS du message (mise en cache) |
| POST | `/media/upload-signature` | Signature de téléversement Cloudinary pour une note vocale ou une dictée |
| POST | `/notebook` · GET `/notebook` | Carnet personnel |
| GET | `/series/:season` · GET `/episodes/:id` | Série et épisode |
| POST | `/episodes/:id/progress` | Étape terminée `{ step }` |
| GET | `/games` · POST `/games/:type/sessions` | Liste et nouvelle partie (questions générées depuis le noyau) |
| POST | `/games/sessions/:id/answers` | Réponse ; renvoie juste/faux, points, combo |
| GET | `/reviews/due` · POST `/reviews/:cardId/grade` | Révisions FSRS (`again`, `hard`, `good`, `easy`) |
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
| `RATE_LIMITED` | 429 | Trop de requêtes |
| `AI_UNAVAILABLE` | 503 | Fournisseur IA indisponible, réessayer |
| `PAYMENT_FAILED` | 402 | Paiement refusé |

## Limites de débit

- Globale : 120 requêtes / minute / utilisateur ; 30 / minute / IP non authentifiée.
- Messages IA : selon l'offre (voir `02-fonctionnalites.md`), vérifiés avant l'envoi au LLM.
- En-têtes renvoyés : `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.
