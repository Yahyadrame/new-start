import { utimesSync, writeFileSync } from 'node:fs';

/** Touche `file` toutes les `everyMs` ms : le HEALTHCHECK Docker lit sa date. Retourne la fonction d'arrêt. */
export function startHeartbeat(file: string, everyMs = 15_000): () => void {
  writeFileSync(file, '');
  const timer = setInterval(() => {
    const now = new Date();
    utimesSync(file, now, now);
  }, everyMs);
  return () => clearInterval(timer);
}
