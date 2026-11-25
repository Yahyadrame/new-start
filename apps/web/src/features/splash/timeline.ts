/** Durées de l'écran de démarrage, en millisecondes. Un seul endroit pour les ajuster. */
export const TIMELINE = { first: 2700, regular: 1300, reduced: 400, fade: 200 } as const;

export type Track = 'first' | 'regular';

export const FIRST_LAUNCH_KEY = 'ns.firstLaunchDone';
export const SHOWN_KEY = 'ns.splashShown';
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
