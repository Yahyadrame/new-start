'use client';

import { useCallback, useEffect, useState } from 'react';

export type ServerState = 'checking' | 'ready' | 'unreachable';

const EVERY_MS = 3000;
const GIVE_UP_MS = 120_000;

/** Interroge /health/live jusqu'à la réponse de l'API (Render la réveille en environ une minute). */
export function useServerReady(apiUrl: string | undefined) {
  const [state, setState] = useState<ServerState>(apiUrl ? 'checking' : 'ready');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!apiUrl) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();
    setState('checking');

    const check = async () => {
      const ok = await fetch(`${apiUrl}/health/live`, { signal: AbortSignal.timeout(5000) }).then(
        (r) => r.ok,
        () => false,
      );
      if (stopped) return;
      if (ok) setState('ready');
      else if (Date.now() - startedAt >= GIVE_UP_MS) setState('unreachable');
      else timer = setTimeout(check, EVERY_MS);
    };
    void check();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [apiUrl, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, retry };
}
