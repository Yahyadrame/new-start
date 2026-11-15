import { describe, expect, it } from 'vitest';
import { normalize, pcmToWav, percentile, wordErrorRate } from './metrics.js';

describe('normalize', () => {
  it('retire la casse, la ponctuation et les espaces en trop', () => {
    expect(normalize('  Hello,   World! It’s ok. ')).toBe("hello world it's ok");
  });
});

describe('wordErrorRate', () => {
  it('vaut 0 pour des phrases égales à la ponctuation près', () => {
    expect(wordErrorRate('I agree with you.', 'i agree with you')).toBe(0);
  });
  it('compte une substitution', () => {
    expect(wordErrorRate('I agree with you', 'I agree with them')).toBe(0.25);
  });
  it('compte une suppression et une insertion', () => {
    expect(wordErrorRate('a b c d', 'a c d')).toBe(0.25);
    expect(wordErrorRate('a b', 'a x b')).toBe(0.5);
  });
  it('gère une référence vide', () => {
    expect(wordErrorRate('', '')).toBe(0);
    expect(wordErrorRate('', 'oops')).toBe(1);
  });
  it('vaut 1 quand tout est faux', () => {
    expect(wordErrorRate('a b', 'c d')).toBe(1);
  });
});

describe('percentile', () => {
  it('renvoie la valeur au rang le plus proche', () => {
    const v = [5, 1, 4, 2, 3, 10, 9, 8, 7, 6];
    expect(percentile(v, 50)).toBe(5);
    expect(percentile(v, 95)).toBe(10);
    expect(percentile(v, 0)).toBe(1);
  });
  it('vaut 0 sans valeurs', () => {
    expect(percentile([], 50)).toBe(0);
  });
});

describe('pcmToWav', () => {
  it('ajoute un en-tête WAV de 44 octets cohérent', () => {
    const pcm = new Uint8Array([1, 2, 3, 4]);
    const wav = pcmToWav(pcm, 16000);
    const view = new DataView(wav.buffer);
    expect(wav.byteLength).toBe(48);
    expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...wav.slice(8, 12))).toBe('WAVE');
    expect(view.getUint32(4, true)).toBe(40);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint32(40, true)).toBe(4);
    expect([...wav.slice(44)]).toEqual([1, 2, 3, 4]);
  });
});
