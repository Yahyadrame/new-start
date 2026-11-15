import * as Sentry from '@sentry/browser';
import { scrub } from './scrub';

export function initSentry(dsn: string | undefined): boolean {
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: process.env['NEXT_PUBLIC_SENTRY_ENVIRONMENT'] ?? process.env.NODE_ENV,
    tracesSampleRate: 0,
    beforeSend: scrub,
  });
  return true;
}
