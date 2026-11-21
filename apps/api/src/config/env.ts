import { z } from 'zod';

export const ENV = Symbol('ENV');

const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Phase 1 : les jobs tournent dans l'API ; phase 2 : dans apps/worker.
  RUN_JOBS: z.enum(['inline', 'separate']).default('inline'),
  DATABASE_URL: z.string().min(1),
  // Facultatif : /health/ready ne teste Redis que s'il est configuré.
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  // Facultatif : sans DSN, Sentry reste éteint et rien ne part.
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().url().optional()),
  // Part des requêtes tracées par Sentry (0 à 1), pour l'alerte de taux d'erreur. 0 = aucune trace.
  SENTRY_TRACES_SAMPLE_RATE: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0).max(1).default(0),
  ),
  // Facultatif : sans adresse, OpenTelemetry reste éteint. Sans « / » final, ex. https://otlp-gateway-xxx.grafana.net/otlp.
  OTEL_EXPORTER_OTLP_ENDPOINT: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .url()
      .transform((v) => v.replace(/\/+$/, ''))
      .optional(),
  ),
  // Facultatif : sans jeton, /health/sentry-test répond 404. Sert à vérifier que Sentry reçoit bien les erreurs.
  SENTRY_TEST_TOKEN: z.preprocess(emptyToUndefined, z.string().min(16).optional()),
  // Brevo : sans clé ou sans MAIL_FROM, les e-mails restent en mémoire (adaptateur factice).
  BREVO_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  MAIL_FROM: z.preprocess(emptyToUndefined, z.string().email().optional()),
  MAIL_FROM_NAME: z.preprocess(emptyToUndefined, z.string().min(1).default('New Start')),
  // SMS éteints au lancement : le porteur doit d'abord accorder un budget.
  SMS_ENABLED: z
    .preprocess(emptyToUndefined, z.enum(['true', 'false']).default('false'))
    .transform((v) => v === 'true'),
  // Expéditeur SMS : 3 à 11 caractères alphanumériques.
  SMS_SENDER: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^[A-Za-z0-9]{3,11}$/)
      .default('NewStart'),
  ),
  // Clé qui protège les codes de connexion (HMAC). Sans elle, une clé est tirée à chaque démarrage.
  OTP_SECRET: z.preprocess(emptyToUndefined, z.string().min(32).optional()),
  // Clé privée ES256 (PEM PKCS8, retours à la ligne écrits \n) qui signe les jetons d'accès. Vide : clé tirée au démarrage.
  JWT_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  // IA : fournisseur par brique (groq, gemini) et clés. Vide, inconnu ou clé manquante : adaptateur factice.
  LLM_PROVIDER: z.preprocess(emptyToUndefined, z.string().optional()),
  STT_PROVIDER: z.preprocess(emptyToUndefined, z.string().optional()),
  TTS_PROVIDER: z.preprocess(emptyToUndefined, z.string().optional()),
  GROQ_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  // Limite d'usage du lancement : messages envoyés par personne et par jour (docs/02-fonctionnalites.md).
  MESSAGES_PER_DAY: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(60)),
  // Limite de débit générale par adresse IP (requêtes par minute). 0 = éteinte (défaut) : à régler après TRUST_PROXY_HOPS.
  RATE_LIMIT_PER_MINUTE: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).default(0)),
  // Nombre de proxys entre le navigateur et l'API (1 sur Render) : sans lui, toutes les requêtes semblent venir du proxy.
  TRUST_PROXY_HOPS: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).default(0)),
  AI_MAX_CALLS_PER_MONTH: z.preprocess(emptyToUndefined, z.string().optional()),
  // Origines web autorisées à appeler l'API (CORS), séparées par des virgules. Vide = aucune.
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof schema>;

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Variables d'environnement invalides : ${fields}`);
  }
  return result.data;
}
