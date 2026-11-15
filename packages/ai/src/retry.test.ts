import { describe, expect, it, vi } from 'vitest';
import { ProviderError } from './providers/http.js';
import { isTransient, isTransientOrBadAudio, withRetry } from './retry.js';

const sleep = vi.fn(async () => {});
const retry = { sleep, delayMs: 10 };

describe('withRetry', () => {
  it('réessaie sur 429 puis réussit, avec une attente qui double', async () => {
    sleep.mockClear();
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ProviderError('p', 429, ''))
      .mockRejectedValueOnce(new ProviderError('p', 503, ''))
      .mockResolvedValue('ok');
    await expect(withRetry(fn, retry)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[10], [20]]);
  });

  it('renvoie la dernière erreur quand les essais sont épuisés', async () => {
    const fn = vi.fn(async () => {
      throw new ProviderError('p', 500, '');
    });
    await expect(withRetry(fn, { ...retry, retries: 1 })).rejects.toThrow('HTTP 500');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('ne réessaie pas une erreur définitive', async () => {
    const fn = vi.fn(async () => {
      throw new ProviderError('p', 401, '');
    });
    await expect(withRetry(fn, retry)).rejects.toThrow('HTTP 401');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('attend avec setTimeout quand aucun sleep n’est fourni', async () => {
    const fn = vi
      .fn<() => Promise<number>>()
      .mockRejectedValueOnce(new ProviderError('p', 429, ''))
      .mockResolvedValue(1);
    await expect(withRetry(fn, { delayMs: 1 })).resolves.toBe(1);
  });
});

describe('isTransient', () => {
  it('reconnaît 429, 5xx et le délai dépassé, pas le reste', () => {
    expect(isTransient(new ProviderError('p', 429, ''))).toBe(true);
    expect(isTransient(new ProviderError('p', 502, ''))).toBe(true);
    expect(isTransient(new ProviderError('p', 400, ''))).toBe(false);
    expect(isTransient(Object.assign(new Error('t'), { name: 'TimeoutError' }))).toBe(true);
    expect(isTransient(new Error('autre'))).toBe(false);
    expect(isTransient('texte')).toBe(false);
  });

  it('accepte aussi le 400 de Gemini TTS', () => {
    expect(isTransientOrBadAudio(new ProviderError('gemini', 400, ''))).toBe(true);
    expect(isTransientOrBadAudio(new ProviderError('gemini', 401, ''))).toBe(false);
  });
});
