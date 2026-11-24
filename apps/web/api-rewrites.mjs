import process from 'node:process';

/**
 * Le navigateur n'appelle jamais l'API en direct : tout `/api/*` est relayé vers elle. Ainsi le cookie de
 * rafraîchissement vit sur le domaine du site (décision du 2026-11-15) et aucune route ne dépend d'une
 * liste à tenir à jour. Les routes propres au site (par exemple `/api/sentry-test`) passent avant le relais.
 * @returns {{ source: string; destination: string }[]}
 */
export function apiRewrites() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return [{ source: '/api/:path*', destination: `${api}/:path*` }];
}
