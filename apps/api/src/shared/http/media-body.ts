import type { NestExpressApplication } from '@nestjs/platform-express';

/** Photos et vocaux arrivent en octets bruts (`Content-Type: audio/*` ou `image/*`), 4 Mo au plus. */
export const MEDIA_LIMIT = '4mb';
export const useMediaBody = (app: NestExpressApplication) =>
  app.useBodyParser('raw', { type: ['audio/*', 'image/*'], limit: MEDIA_LIMIT });
