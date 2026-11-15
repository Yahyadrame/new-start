import { describe, expect, it, vi } from 'vitest';
import { FakeLlm, FakeStt, FakeTts } from './fake.js';
import { reliableLlm, reliableStt, reliableTts, UsageCap } from './fallback.js';
import { ProviderError } from './providers/http.js';
import type { LlmProvider, LlmRequest } from './types.js';

const retry = { sleep: async () => {}, delayMs: 10 };
const request: Omit<LlmRequest, 'json'> = {
  system: 's',
  messages: [{ role: 'user', content: 'hi' }],
};

function scripted(text: string): LlmProvider {
  return { name: 'scripted', complete: async () => ({ text }) };
}

describe('UsageCap', () => {
  it('refuse au-delà du plafond et repart à zéro le mois suivant', () => {
    let now = new Date('2026-11-30T10:00:00Z');
    const cap = new UsageCap(2, () => now);
    expect([cap.take(), cap.take(), cap.take()]).toEqual([true, true, false]);
    now = new Date('2026-12-01T00:00:00Z');
    expect(cap.take()).toBe(true);
  });

  it('un plafond de 0 refuse tout', () => {
    expect(new UsageCap(0).take()).toBe(false);
  });
});

describe('reliableLlm', () => {
  const failing = (status: number): LlmProvider => ({
    name: 'primary',
    complete: vi.fn(async () => {
      throw new ProviderError('p', status, '');
    }),
  });

  it('utilise le fournisseur tant que le plafond n’est pas atteint', async () => {
    const llm = reliableLlm(scripted('vrai'), new FakeLlm(), { cap: new UsageCap(1), retry });
    expect((await llm.complete(request)).text).toBe('vrai');
    expect(llm.name).toBe('scripted');
  });

  it('bascule sur le factice quand le plafond est atteint', async () => {
    const onFallback = vi.fn();
    const llm = reliableLlm(scripted('vrai'), new FakeLlm(), {
      cap: new UsageCap(0),
      onFallback,
    });
    expect((await llm.complete(request)).text).toBe('Got it: hi');
    expect(onFallback).toHaveBeenCalledWith('cap', 'scripted');
  });

  it('bascule sur le factice quand le quota reste épuisé après les essais', async () => {
    const primary = failing(429);
    const onFallback = vi.fn();
    const llm = reliableLlm(primary, new FakeLlm(), { cap: new UsageCap(5), retry, onFallback });
    expect((await llm.complete(request)).text).toBe('Got it: hi');
    expect(primary.complete).toHaveBeenCalledTimes(3);
    expect(onFallback).toHaveBeenCalledWith('error', 'primary');
  });

  it('laisse remonter une erreur définitive (clé refusée)', async () => {
    const llm = reliableLlm(failing(401), new FakeLlm(), { cap: new UsageCap(5), retry });
    await expect(llm.complete(request)).rejects.toThrow('HTTP 401');
  });
});

describe('reliableStt et reliableTts', () => {
  const audio = new Uint8Array(4);

  it('STT : bascule sur le factice quand le plafond est atteint', async () => {
    const primary = { name: 'stt', transcribe: vi.fn() };
    const stt = reliableStt(primary, new FakeStt(), { cap: new UsageCap(0) });
    expect((await stt.transcribe({ audio, mimeType: 'audio/webm' })).text).toBe('audio of 4 bytes');
    expect(primary.transcribe).not.toHaveBeenCalled();
  });

  it('STT : réussit avec le fournisseur', async () => {
    const primary = { name: 'stt', transcribe: vi.fn(async () => ({ text: 'hello' })) };
    const stt = reliableStt(primary, new FakeStt(), { cap: new UsageCap(1), retry });
    expect((await stt.transcribe({ audio, mimeType: 'audio/webm' })).text).toBe('hello');
  });

  it('TTS : réessaie le 400 de Gemini puis réussit', async () => {
    const wav = { audio, mimeType: 'audio/wav' };
    const primary = {
      name: 'tts',
      synthesize: vi
        .fn()
        .mockRejectedValueOnce(new ProviderError('gemini', 400, 'texte'))
        .mockResolvedValue(wav),
    };
    const tts = reliableTts(primary, new FakeTts(), { cap: new UsageCap(1), retry });
    await expect(tts.synthesize({ text: 'hi' })).resolves.toEqual(wav);
    expect(primary.synthesize).toHaveBeenCalledTimes(2);
  });

  it('TTS : bascule sur le factice quand le plafond est atteint', async () => {
    const primary = { name: 'tts', synthesize: vi.fn() };
    const tts = reliableTts(primary, new FakeTts(), { cap: new UsageCap(0) });
    expect((await tts.synthesize({ text: 'hi' })).mimeType).toBe('audio/fake');
  });
});
