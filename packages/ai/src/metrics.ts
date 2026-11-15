/** Outils de mesure pour comparer les fournisseurs (NS-010). */

/** Minuscules, sans ponctuation, espaces réduits : on compare les mots, pas la typographie. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Taux d'erreur de mots (distance de Levenshtein sur les mots / nombre de mots attendus). */
export function wordErrorRate(reference: string, hypothesis: string): number {
  const ref = normalize(reference).split(' ').filter(Boolean);
  const hyp = normalize(hypothesis).split(' ').filter(Boolean);
  if (ref.length === 0) return hyp.length === 0 ? 0 : 1;
  let prev = Array.from({ length: hyp.length + 1 }, (_, j) => j);
  for (let i = 1; i <= ref.length; i++) {
    const row = [i];
    for (let j = 1; j <= hyp.length; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      row[j] = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = row;
  }
  return (prev[hyp.length] ?? 0) / ref.length;
}

/** Percentile par rang le plus proche (p entre 0 et 100). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1] ?? 0;
}

/** Entoure du PCM 16 bits mono d'un en-tête WAV, pour l'envoyer à une API de transcription. */
export function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const header = new DataView(new ArrayBuffer(44));
  const text = (offset: number, s: string) =>
    [...s].forEach((c, i) => header.setUint8(offset + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  header.setUint32(4, 36 + pcm.byteLength, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true); // PCM
  header.setUint16(22, 1, true); // mono
  header.setUint32(24, sampleRate, true);
  header.setUint32(28, sampleRate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  text(36, 'data');
  header.setUint32(40, pcm.byteLength, true);
  const wav = new Uint8Array(44 + pcm.byteLength);
  wav.set(new Uint8Array(header.buffer), 0);
  wav.set(pcm, 44);
  return wav;
}
