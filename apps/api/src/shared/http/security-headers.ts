import type { NestExpressApplication } from '@nestjs/platform-express';

/** En-têtes posés sur chaque réponse de l'API (NS-603). L'API ne sert que du JSON : rien ne doit s'afficher dans un cadre. */
export const API_SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
};

type Res = { setHeader(name: string, value: string): unknown };

export const securityHeaders = (_req: unknown, res: Res, next: () => void) => {
  for (const [name, value] of Object.entries(API_SECURITY_HEADERS)) res.setHeader(name, value);
  next();
};

export const useSecurityHeaders = (app: NestExpressApplication) => {
  app.disable('x-powered-by');
  app.use(securityHeaders);
};
