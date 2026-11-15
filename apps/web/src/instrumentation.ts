// Next.js appelle register() au démarrage du serveur. Le DSN public du navigateur sert de repli
// pour ne pas imposer une seconde variable sur Vercel.
// Import dynamique dans un `if` sur NEXT_RUNTIME : Next le remplace à la compilation, donc le
// bundle edge (compilé aussi en dev) n'embarque pas Sentry Node, qui ne connaît pas `node:`.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentryServer } = await import('./shared/monitoring/sentry.server');
    initSentryServer(process.env['SENTRY_DSN'] ?? process.env['NEXT_PUBLIC_SENTRY_DSN']);
  }
}

// Erreurs levées pendant le rendu serveur, les routes et les actions.
export async function onRequestError(error: unknown): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { captureServerError } = await import('./shared/monitoring/sentry.server');
    captureServerError(error);
  }
}
