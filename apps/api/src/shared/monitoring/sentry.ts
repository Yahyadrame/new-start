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

export type TransactionEvent = Parameters<
  NonNullable<Sentry.NodeOptions['beforeSendTransaction']>
>[0];

// Une trace garde la méthode, la route et le statut : l'adresse perd sa requête, le reste est retiré.
export function scrubTransaction(event: TransactionEvent): TransactionEvent {
  scrub(event as unknown as ErrorEvent);
  if (event.request?.url) event.request.url = event.request.url.split(/[?#]/)[0] ?? '';
  delete event.contexts?.['trace']?.data?.['http.query'];
  return event;
}

// Retourne false (et ne touche à rien) tant que SENTRY_DSN n'est pas défini.
export function initSentry(
  env: Pick<Env, 'SENTRY_DSN' | 'NODE_ENV'> & Partial<Pick<Env, 'SENTRY_TRACES_SAMPLE_RATE'>>,
): boolean {
  if (!env.SENTRY_DSN) return false;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: process.env['SENTRY_ENVIRONMENT'] ?? env.NODE_ENV,
    release: process.env['RENDER_GIT_COMMIT'],
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? 0,
    beforeSend: scrub,
    beforeSendTransaction: scrubTransaction,
  });
  return true;
}
