export const TIME_ATTACK_SECONDS = 60;
const RECORD_KEY = 'ns-time-attack-record';

/** Combo : x1 au début, x2 à 3 bonnes réponses de suite, x3 à 6. */
export const multiplier = (streak: number) => (streak >= 6 ? 3 : streak >= 3 ? 2 : 1);

/** Points d'une bonne réponse, selon la série en cours avant elle. */
export const pointsFor = (streakBefore: number) => 10 * multiplier(streakBefore + 1);

// ponytail: record gardé sur l'appareil ; passer au serveur avec l'API de progression (NS-5xx).
export function readRecord(): number {
  try {
    return Number(localStorage.getItem(RECORD_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveRecord(score: number): void {
  try {
    if (score > readRecord()) localStorage.setItem(RECORD_KEY, String(score));
  } catch {
    // stockage indisponible : le record n'est pas gardé, la partie n'en souffre pas
  }
}
