import { z } from 'zod';

export const ENV = Symbol('ENV');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Phase 1 : les jobs tournent dans l'API ; phase 2 : dans apps/worker.
  RUN_JOBS: z.enum(['inline', 'separate']).default('inline'),
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
