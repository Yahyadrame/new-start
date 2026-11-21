import type { NestExpressApplication } from '@nestjs/platform-express';

type Req = { ip?: string | undefined; path: string };
type Res = {
  setHeader(name: string, value: string): unknown;
  status(code: number): { json(body: unknown): unknown };
};

const WINDOW_MS = 60_000;
const SWEEP_AT = 10_000;

/**
 * Fenêtre fixe d'une minute par adresse IP, en mémoire (NS-603). Les sondes `/health` ne comptent pas.
 * ponytail: compteurs propres à chaque instance ; passer par Redis dès que l'API tourne sur plusieurs instances.
 */
export function rateLimit(limit: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req: Req, res: Res, next: () => void) => {
    if (req.path.startsWith('/health')) return next();
    const t = now();
    if (hits.size > SWEEP_AT) for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
    const key = req.ip ?? 'inconnue';
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      entry = { count: 0, resetAt: t + WINDOW_MS };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count <= limit) return next();
    res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - t) / 1000)));
    res
      .status(429)
      .json({ code: 'RATE_LIMITED', message: 'Trop de requêtes. Réessaie dans un instant.' });
  };
}

export const useRateLimit = (app: NestExpressApplication, limit: number, proxyHops: number) => {
  app.set('trust proxy', proxyHops);
  if (limit > 0) app.use(rateLimit(limit));
};
