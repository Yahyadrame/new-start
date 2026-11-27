import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { originMatchers } from './config/cors.js';
import { ENV, type Env } from './config/env.js';
import { useMediaBody } from './shared/http/media-body.js';
import { useRateLimit } from './shared/http/rate-limit.js';
import { useSecurityHeaders } from './shared/http/security-headers.js';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  useMediaBody(app);
  useSecurityHeaders(app);
  app.useLogger(app.get(Logger));
  const { CORS_ORIGINS, RATE_LIMIT_PER_MINUTE, TRUST_PROXY_HOPS } = app.get<Env>(ENV);
  useRateLimit(app, RATE_LIMIT_PER_MINUTE, TRUST_PROXY_HOPS);
  if (CORS_ORIGINS.length > 0) app.enableCors({ origin: originMatchers(CORS_ORIGINS) });
  // SIGTERM : on cesse d'accepter des requêtes, on termine celles en cours, puis on ferme base et Redis.
  app.enableShutdownHooks();
  return app;
}
