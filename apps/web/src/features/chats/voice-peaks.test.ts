import { VOICE_PEAKS_MAX } from '@newstart/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VOICE_BARS, voicePeaks } from './voice-peaks';

/** Un décodeur qui rend ces échantillons, ou qui échoue. */
function decoding(samples: number[] | Error) {
  vi.stubGlobal(
    'OfflineAudioContext',
    class {
      decodeAudioData() {
        if (samples instanceof Error) return Promise.reject(samples);
        return Promise.resolve({ getChannelData: () => Float32Array.from(samples) });
      }
    },
  );
}
const clip = { arrayBuffer: async () => new ArrayBuffer(1) } as Blob;

afterEach(() => vi.unstubAllGlobals());

describe('voicePeaks', () => {
  it('rend une barre par tranche, la plus forte valant 100, quel que soit le signe', async () => {
    const half = VOICE_BARS;
    decoding([...Array<number>(half).fill(0.25), ...Array<number>(half).fill(-0.5)]);
    expect(await voicePeaks(clip)).toEqual([
      ...Array<number>(VOICE_BARS / 2).fill(50),
      ...Array<number>(VOICE_BARS / 2).fill(100),
    ]);
  });

  it('reste dans la limite de l’API', () => {
    expect(VOICE_BARS).toBeLessThanOrEqual(VOICE_PEAKS_MAX);
  });

  it('ne rend pas plus de barres que d’échantillons', async () => {
    decoding([0.1, 0.2, 0.4]);
    expect(await voicePeaks(clip)).toEqual([25, 50, 100]);
  });

  it('rend des barres à zéro pour un silence', async () => {
    decoding([0, 0]);
    expect(await voicePeaks(clip)).toEqual([0, 0]);
  });

  it.each([
    ['vide', []],
    ['illisible', new Error('format inconnu')],
  ])('ne rend rien pour un enregistrement %s', async (_cas, samples) => {
    decoding(samples);
    expect(await voicePeaks(clip)).toBeUndefined();
  });

  it('ne rend rien sans décodeur audio', async () => {
    vi.stubGlobal('OfflineAudioContext', undefined);
    expect(await voicePeaks(clip)).toBeUndefined();
  });
});
