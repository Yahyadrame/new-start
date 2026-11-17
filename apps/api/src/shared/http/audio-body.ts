import type { NestExpressApplication } from '@nestjs/platform-express';

/** Les notes vocales arrivent en octets bruts (`Content-Type: audio/*`), 1 Mo au plus (environ 60 s). */
export const AUDIO_LIMIT = '1mb';
export const useAudioBody = (app: NestExpressApplication) =>
  app.useBodyParser('raw', { type: 'audio/*', limit: AUDIO_LIMIT });
