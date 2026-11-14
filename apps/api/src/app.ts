import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { originMatchers } from './config/cors.js';
import { ENV, type Env } from './config/env.js';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  const { CORS_ORIGINS } = app.get<Env>(ENV);
  if (CORS_ORIGINS.length > 0) app.enableCors({ origin: originMatchers(CORS_ORIGINS) });
  // SIGTERM : on cesse d'accepter des requêtes, on termine celles en cours, puis on ferme base et Redis.
  app.enableShutdownHooks();
  return app;
}
