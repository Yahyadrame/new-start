import * as Sentry from '@sentry/nestjs';
import type { ErrorEvent } from '@sentry/nestjs';
import type { Env } from '../../config/env.js';

// Pas de corps de requête, de cookie, d'en-tête ni d'identité d'utilisateur : ni donnée personnelle ni contenu de message.
export function scrub(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    const { method, url } = event.request;
    event.request = { ...(method && { method }), ...(url && { url }) };
  }
  delete event.user;
  return event;
}

// Retourne false (et ne touche à rien) tant que SENTRY_DSN n'est pas défini.
export function initSentry(env: Pick<Env, 'SENTRY_DSN' | 'NODE_ENV'>): boolean {
  if (!env.SENTRY_DSN) return false;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? env.NODE_ENV,
    release: process.env['RENDER_GIT_COMMIT'],
    tracesSampleRate: 0, // ponytail: erreurs seulement ; les traces viennent avec OpenTelemetry.
    beforeSend: scrub,
  });
  return true;
}
