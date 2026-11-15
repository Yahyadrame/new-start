import * as Sentry from '@sentry/node';
import { scrub } from './scrub';

// Même nettoyage que dans le navigateur : rien ne part sans DSN, et l'événement perd
// utilisateur, breadcrumbs, en-têtes et requête avant l'envoi.
export function initSentryServer(dsn: string | undefined): boolean {
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend: scrub,
  });
  return true;
}

export function captureServerError(error: unknown): void {
  Sentry.captureException(error);
}
