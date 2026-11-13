import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';

export async function createWorker() {
  const app = await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  // SIGTERM : on ferme le contexte proprement avant de quitter.
  app.enableShutdownHooks();
  return app;
}
