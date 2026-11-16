import process from 'node:process';

/**
 * Le cookie de rafraîchissement doit vivre sur le domaine du site : /api/auth/* est relayé vers l'API
 * (décision du 2026-11-15).
 * @returns {{ source: string; destination: string }[]}
 */
export function authRewrites() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return [{ source: '/api/auth/:path*', destination: `${api}/auth/:path*` }];
}
