import { captureServerError, initSentryServer } from './shared/monitoring/sentry.server';

// Next.js appelle register() au démarrage du serveur. Le DSN public du navigateur sert de repli
// pour ne pas imposer une seconde variable sur Vercel.
export function register(): void {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  initSentryServer(process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN']);
}

// Erreurs levées pendant le rendu serveur, les routes et les actions.
export function onRequestError(error: unknown): void {
  captureServerError(error);
}
