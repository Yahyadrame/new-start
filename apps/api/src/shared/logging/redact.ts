// Jamais de jeton ni de cookie dans les logs ; pino-http ne journalise pas les corps de requête.
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-sentry-test-token"]',
  'res.headers["set-cookie"]',
];
