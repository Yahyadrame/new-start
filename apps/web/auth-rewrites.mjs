import process from 'node:process';

/**
 * Le cookie de rafraîchissement doit vivre sur le domaine du site : /api/auth/* est relayé vers l'API
 * (décision du 2026-11-15). /api/onboarding/* suit le même chemin, le navigateur n'appelle ainsi jamais l'API en direct.
 * @returns {{ source: string; destination: string }[]}
 */
export function authRewrites() {
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return ['auth', 'onboarding'].map((area) => ({
    source: `/api/${area}/:path*`,
    destination: `${api}/${area}/:path*`,
  }));
}
