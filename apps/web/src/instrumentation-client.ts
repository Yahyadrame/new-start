import { initSentry } from './shared/monitoring/sentry';

// Next.js exécute ce fichier dans le navigateur avant l'hydratation.
initSentry(process.env['NEXT_PUBLIC_SENTRY_DSN']);
