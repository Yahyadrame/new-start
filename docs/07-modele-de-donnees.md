# 07 — Modèle de données

Base : PostgreSQL 16. ORM : Prisma. Identifiants : UUID v7 (triables dans le temps). Toutes les tables ont `createdAt` et `updatedAt`. Les suppressions de compte sont **réelles** (avec purge des médias), pas de simple drapeau.

## Entités

| Entité | Rôle | Relations principales |
| --- | --- | --- |
| `User` | Compte, prénom, objectif, niveau, réglages | 1–n Conversation, Subscription, ReviewCard |
| `AuthIdentity` | Téléphone ou Google rattaché à un compte | n–1 User |
| `RefreshToken` | Jetons de rafraîchissement (hachés) | n–1 User |
| `Agent` | Contact IA : nom, thème, persona, voix, premier message, suggestions | 1–n Conversation |
| `Topic` | Thème (Amour, Études, Sport…) | 1–n Agent |
| `Conversation` | Fil entre un utilisateur et un agent (ou un groupe en V2) | 1–n Message |
| `Message` | Texte ou audio, auteur (user, agent, system) | 0–1 Correction |
| `Correction` | Version « Plus naturel » + explication | 1–1 Message |
| `Expression`, `Word` | Le noyau (depuis `data/*.csv`) | — |
| `NotebookEntry` | Carnet personnel | n–1 User |
| `ReviewCard` | Carte de révision FSRS par utilisateur et expression | n–1 User, Expression |
| `Episode`, `EpisodeProgress` | Série et avancement | — |
| `GameSession`, `GameAnswer` | Parties et réponses | n–1 User |
| `DailyActivity` | Agrégat par jour : minutes parlées, messages, XP | n–1 User |
| `Plan`, `Subscription`, `Payment` | Offres, abonnements, paiements | n–1 User |
| `UsageCounter` | Compteurs de quota par jour | n–1 User |
| `NotificationLog` | Notifications envoyées (pour limiter à 1/jour) | n–1 User |
| `AuditLog` | Actions sensibles (admin, paiement, suppression) | — |

## Schéma Prisma (extrait de référence)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Goal { SCHOLARSHIP WORK TRAVEL FRIENDS }
enum Cefr { A1 A2 B1 B2 C1 C2 }
enum ThemePref { SYSTEM LIGHT DARK }
enum Author { USER AGENT SYSTEM }
enum MessageKind { TEXT AUDIO }
enum PlanCode { FREE WEEK_PASS PLUS_MONTHLY PLUS_YEARLY PRO_MONTHLY }
enum SubStatus { ACTIVE PAST_DUE CANCELED EXPIRED }
enum PayProvider { WAVE ORANGE_MONEY STRIPE }
enum PayStatus { PENDING SUCCEEDED FAILED REFUNDED }

model User {
  id              String    @id @default(uuid(7)) @db.Uuid
  firstName       String
  goal            Goal
  level           Cefr      @default(A1)
  birthYear       Int?      // pour restreindre les thèmes réservés aux majeurs
  phoneE164       String?   @unique // numéro au format international (+221…), demandé à l'inscription
  phoneVerifiedAt DateTime? // rempli quand la vérification par SMS sera activée
  smsOptIn        Boolean   @default(false) // consentement séparé aux SMS
  locale          String    @default("fr")
  countryCode     String?   // ISO 3166-1 alpha-2, pour la devise
  theme           ThemePref @default(SYSTEM)
  reminderTime    String?   // "19:00"
  timezone        String    @default("Africa/Dakar")
  dailyGoalMin    Int       @default(15)
  preferredAccent String    @default("en-US")
  dataSaver       Boolean   @default(false)
  pausedUntil     DateTime?
  xp              Int       @default(0)
  streakDays      Int       @default(0)
  lastActiveDay   DateTime? @db.Date
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  identities      AuthIdentity[]
  conversations   Conversation[]
  subscriptions   Subscription[]
  reviewCards     ReviewCard[]
  activities      DailyActivity[]
}

model AuthIdentity {
  id         String   @id @default(uuid(7)) @db.Uuid
  userId     String   @db.Uuid
  provider   String   // "phone" | "google"
  subject    String   // numéro E.164 ou sub Google
  verifiedAt DateTime?
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, subject])
}

model Topic {
  id     String  @id @default(uuid(7)) @db.Uuid
  slug   String  @unique           // "love", "studies", "news", "sport"…
  nameFr String
  adultOnly Boolean @default(false) // true pour "love"
  order  Int
  agents Agent[]
}

model Agent {
  id           String   @id @default(uuid(7)) @db.Uuid
  slug         String   @unique
  name         String
  initials     String
  category     String   // "Quotidien" | "Pro" | "Business" | "Voyage"
  topicId      String?  @db.Uuid
  roleFr       String   // "Coloc · familier"
  persona      String   // description utilisée dans le prompt
  style        String
  voiceId      String   // voix TTS fixe
  accent       String   // "en-US", "en-GB", "en-NG"…
  firstMessage String
  suggestions  String[]
  isPremium    Boolean  @default(false)
  isActive     Boolean  @default(true)
  topic        Topic?   @relation(fields: [topicId], references: [id])
  conversations Conversation[]
}

model Conversation {
  id            String    @id @default(uuid(7)) @db.Uuid
  userId        String    @db.Uuid
  agentId       String    @db.Uuid
  lastMessageAt DateTime  @default(now())
  unreadCount   Int       @default(0)
  summary       String?   // résumé glissant pour la mémoire (V2)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  agent         Agent     @relation(fields: [agentId], references: [id])
  messages      Message[]
  @@unique([userId, agentId])
  @@index([userId, lastMessageAt(sort: Desc)])
}

model Message {
  id             String      @id @default(uuid(7)) @db.Uuid
  conversationId String      @db.Uuid
  clientId       String?     @db.Uuid // idempotence
  author         Author
  kind           MessageKind @default(TEXT)
  text           String
  audioKey       String?     // identifiant Cloudinary (public_id)
  translationFr  String?
  createdAt      DateTime    @default(now())
  readAt         DateTime?
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  correction     Correction?
  @@unique([conversationId, clientId])
  @@index([conversationId, createdAt])
}

model Correction {
  id        String  @id @default(uuid(7)) @db.Uuid
  messageId String  @unique @db.Uuid
  better    String?  // null = message déjà parfait
  whyFr     String?
  message   Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
}

model Expression {
  id        Int     @id // rang dans data/expressions.csv
  text      String  @unique
  meaningFr String
  situation String
  register  String  // Familier | Neutre | Poli
  sceneType String
  week      Int
  frequency Float
}

model Word {
  id          Int    @id
  text        String @unique
  translation String
  week        Int
  frequency   Float
}

model ReviewCard {
  id           String   @id @default(uuid(7)) @db.Uuid
  userId       String   @db.Uuid
  expressionId Int
  stability    Float    @default(0)
  difficulty   Float    @default(0)
  due          DateTime @default(now())
  reps         Int      @default(0)
  lapses       Int      @default(0)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, expressionId])
  @@index([userId, due])
}

model DailyActivity {
  id            String   @id @default(uuid(7)) @db.Uuid
  userId        String   @db.Uuid
  day           DateTime @db.Date
  spokenSeconds Int      @default(0)
  messagesSent  Int      @default(0)
  gamesPlayed   Int      @default(0)
  xpEarned      Int      @default(0)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, day])
}

model Subscription {
  id                String    @id @default(uuid(7)) @db.Uuid
  userId            String    @db.Uuid
  plan              PlanCode
  status            SubStatus
  currentPeriodEnd  DateTime
  provider          PayProvider
  providerRef       String?
  cancelAtPeriodEnd Boolean   @default(false)
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments          Payment[]
  @@index([userId, status])
}

model Payment {
  id             String      @id @default(uuid(7)) @db.Uuid
  subscriptionId String      @db.Uuid
  provider       PayProvider
  providerTxId   String
  amountMinor    Int         // en unité mineure (XOF : 1 = 1 FCFA ; USD : centimes)
  currency       String      // "XOF", "USD"…
  status         PayStatus
  rawEvent       Json?
  subscription   Subscription @relation(fields: [subscriptionId], references: [id])
  @@unique([provider, providerTxId])
}

model UsageCounter {
  userId String   @db.Uuid
  day    DateTime @db.Date
  key    String   // "ai_messages", "tts_plays", "call_seconds"
  value  Int      @default(0)
  @@id([userId, day, key])
}
```

## Règles

- Les compteurs chauds (quotas, « en train d'écrire ») vivent dans **Redis** ; `UsageCounter` est la copie durable, consolidée toutes les 5 minutes.
- Les messages sont **paginés par curseur** (`createdAt`, `id`), 30 par page.
- Rétention : audio brut des notes vocales supprimé après 30 jours (la transcription reste) ; journaux d'IA anonymisés après 90 jours.
- Index revus à chaque nouvelle requête lente (seuil : 100 ms, suivi par `pg_stat_statements`).
