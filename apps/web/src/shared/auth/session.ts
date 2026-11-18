export type Session = {
  accessToken: string;
  expiresInSeconds: number;
  user: { id: string; firstName: string; goal: string; level: string };
};

// Le jeton d'accès reste en mémoire : un rechargement le perd, le cookie de rafraîchissement le rend.
let current: Session | null = null;
let expiresAt = 0;
let pending: Promise<Session | null> | null = null;

/** On renouvelle un peu avant l'échéance pour qu'une requête partie à temps ne tombe pas sur un jeton périmé. */
const MARGIN_MS = 60_000;

export const setSession = (s: Session | null) => {
  current = s;
  expiresAt = s ? Date.now() + s.expiresInSeconds * 1000 : 0;
};
export const getSession = () => current;

async function refresh(): Promise<Session | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return null;
    const next = (await res.json()) as Session;
    setSession(next);
    return next;
  } catch {
    return null;
  }
}

/**
 * Rend une session au jeton encore valable : celle en mémoire, sinon une nouvelle obtenue avec le cookie.
 * Les appels simultanés partagent un seul renouvellement (le cookie tourne : un second appel serait vu comme une réutilisation).
 * Null quand il n'y a plus de session : il faut se reconnecter.
 */
export function ensureSession(): Promise<Session | null> {
  if (current && expiresAt - Date.now() > MARGIN_MS) return Promise.resolve(current);
  pending ??= refresh().finally(() => {
    pending = null;
  });
  return pending;
}
