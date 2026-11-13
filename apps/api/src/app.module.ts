import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module.js';
import { ENV, type Env } from './config/env.js';
import { HealthModule } from './modules/health/health.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.LOG_LEVEL,
          // Jamais de jeton ni de cookie dans les logs ; pino-http ne journalise pas les corps de requête.
          redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        },
      }),
    }),
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
