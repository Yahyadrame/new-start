/** Barres gardées pour l'onde d'un vocal ; le lecteur les adapte à sa largeur. */
export const VOICE_BARS = 40;

/**
 * L'onde d'un vocal, en barres de 0 à 100 (la plus forte vaut 100), calculée sur l'appareil.
 * Rend `undefined` si le navigateur ne sait pas la lire : le vocal part alors sans elle.
 */
export async function voicePeaks(clip: Blob): Promise<number[] | undefined> {
  try {
    // 8 kHz suffisent pour une enveloppe et allègent le décodage d'un vocal de deux minutes.
    const context = new OfflineAudioContext(1, 1, 8000);
    const audio = await context.decodeAudioData(await clip.arrayBuffer());
    const samples = audio.getChannelData(0);
    const bars = Math.min(VOICE_BARS, samples.length);
    if (!bars) return undefined;
    const at = (bar: number) => Math.floor((bar * samples.length) / bars);
    const loudest = Array.from({ length: bars }, (_, bar) =>
      samples
        .subarray(at(bar), at(bar + 1))
        .reduce((max, sample) => Math.max(max, Math.abs(sample)), 0),
    );
    const top = Math.max(...loudest);
    return loudest.map((peak) => (top ? Math.round((peak / top) * 100) : 0));
  } catch {
    return undefined;
  }
}
