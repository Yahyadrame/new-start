import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module.js';
import { ENV, type Env } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ConversationsModule } from './modules/conversations/conversations.module.js';
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
    MeModule,
    ConversationsModule,
  ],
  // Sans Sentry.init, le filtre renvoie les erreurs comme Nest le fait déjà : rien n'est envoyé.
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
