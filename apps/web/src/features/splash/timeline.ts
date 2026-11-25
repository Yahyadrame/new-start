/** Durées de l'écran de démarrage, en millisecondes. Un seul endroit pour les ajuster. */
export const TIMELINE = { first: 2700, regular: 1300, reduced: 400, fade: 200 } as const;

/** Absence au-delà de laquelle le retour dans l'appli rejoue l'écran de démarrage (NS-043). */
export const AWAY_MS = 5 * 60 * 1000;

export type Track = 'first' | 'regular';

export const FIRST_LAUNCH_KEY = 'ns.firstLaunchDone';
/** Posée à « off » (tests de bout en bout), l'animation ne se joue pas. */
export const OFF_KEY = 'ns.splash';

/** Toute première ouverture : « La correction » ; sinon (ou si le stockage échoue) : « La bulle s'ouvre ». */
export function pickTrack(storage: Pick<Storage, 'getItem'>): Track {
  try {
    return storage.getItem(FIRST_LAUNCH_KEY) ? 'regular' : 'first';
  } catch {
    return 'regular';
  }
}

export function durationFor(track: Track, reducedMotion: boolean): number {
  return reducedMotion ? TIMELINE.reduced : TIMELINE[track];
}

/** Vrai quand l'appli revient au premier plan après AWAY_MS ou plus (`hiddenAt` : instant du départ, ou null). */
export function shouldReplay(hiddenAt: number | null, now: number): boolean {
  return hiddenAt !== null && now - hiddenAt >= AWAY_MS;
}
