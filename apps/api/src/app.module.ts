import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module.js';
import { ENV, type Env } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { GamesModule } from './modules/games/games.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { PlansModule } from './modules/plans/plans.module.js';
import { ProgressModule } from './modules/progress/progress.module.js';
import { NotebookModule } from './modules/notebook/notebook.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
import { ContactAvatarsModule } from './modules/contact-avatars/contact-avatars.module.js';
import { ContactVariantsModule } from './modules/contact-variants/contact-variants.module.js';
import { MeModule } from './modules/me/me.module.js';
import { OnboardingModule } from './modules/onboarding/onboarding.module.js';
import { AiModule } from './shared/ai/ai.module.js';
import { MessagingModule } from './shared/brevo/messaging.module.js';
import { REDACT_PATHS } from './shared/logging/redact.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          redact: REDACT_PATHS,
        },
      }),
    }),
    PrismaModule,
    MessagingModule,
    AiModule,
    HealthModule,
    AuthModule,
    OnboardingModule,
    ContactAvatarsModule,
    ContactVariantsModule,
    MeModule,
    ConversationsModule,
    CatalogModule,
    PlansModule,
    NotebookModule,
    ReviewsModule,
    GamesModule,
    ProgressModule,
    NotificationsModule,
  ],
  // Sans Sentry.init, le filtre renvoie les erreurs comme Nest le fait déjà : rien n'est envoyé.
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
