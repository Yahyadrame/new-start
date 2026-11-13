import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // SIGTERM : on cesse d'accepter des requêtes, on termine celles en cours, puis on ferme base et Redis.
  app.enableShutdownHooks();
  return app;
}
