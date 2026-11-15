import type { ErrorEvent } from '@sentry/node';

// Sans DSN, rien ne part. Avec un DSN, on n'envoie que le message d'erreur, la pile et l'adresse
// de la page sans sa requête ni son ancre (un lien de réinitialisation y met un jeton). On retire
// aussi les en-têtes, l'utilisateur et les breadcrumbs, où pourrait traîner du texte saisi.
export function scrub(event: ErrorEvent): ErrorEvent {
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
