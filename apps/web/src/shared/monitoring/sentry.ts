import * as Sentry from '@sentry/browser';

// Sans DSN, rien ne part. Avec un DSN, on n'envoie que le message d'erreur, la pile et l'adresse
// de la page sans sa requête ni son ancre (un lien de réinitialisation y met un jeton). On retire
// aussi les en-têtes, l'utilisateur et les breadcrumbs, où pourrait traîner du texte saisi.
export function scrub(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  delete event.user;
  delete event.breadcrumbs;
  if (event.request?.url) {
    const url = new URL(event.request.url);
    event.request = { url: url.origin + url.pathname };
  } else {
    delete event.request;
  }
  return event;
}

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
