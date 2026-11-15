import { describe, expect, it, vi } from 'vitest';
import { createAiProviders } from './factory.js';

const request = { system: 's', messages: [{ role: 'user' as const, content: 'hi' }] };
const ok = () =>
  vi.fn<typeof fetch>(
    async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'réponse groq' } }] })),
  );

describe('createAiProviders', () => {
  it('prend les adaptateurs factices sans configuration', async () => {
    const ai = createAiProviders({});
    expect(ai.llm.name).toBe('fake');
    expect(ai.stt.name).toBe('fake');
    expect(ai.tts.name).toBe('fake');
    expect((await ai.llm.complete(request)).text).toBe('Got it: hi');
  });

  it('prend le factice quand la clé manque ou que le fournisseur est inconnu', () => {
    expect(createAiProviders({ LLM_PROVIDER: 'groq' }).llm.name).toBe('fake');
    expect(createAiProviders({ LLM_PROVIDER: 'inconnu', GROQ_API_KEY: 'k' }).llm.name).toBe('fake');
    expect(createAiProviders({ TTS_PROVIDER: 'gemini' }).tts.name).toBe('fake');
  });

  it('choisit Groq ou Gemini pour le LLM, Groq pour le STT, Gemini pour le TTS', () => {
    const env = { GROQ_API_KEY: 'g', GEMINI_API_KEY: 'm' };
    expect(createAiProviders({ ...env, LLM_PROVIDER: 'groq' }).llm.name).toBe(
      'groq/openai/gpt-oss-20b',
    );
    expect(createAiProviders({ ...env, LLM_PROVIDER: 'gemini' }).llm.name).toBe(
      'gemini/gemini-3.5-flash-lite',
    );
    expect(createAiProviders({ ...env, STT_PROVIDER: 'groq' }).stt.name).toBe(
      'groq/whisper-large-v3-turbo',
    );
    expect(createAiProviders({ ...env, TTS_PROVIDER: 'gemini' }).tts.name).toMatch(/^gemini\//);
  });

  it('appelle le fournisseur puis bascule sur le factice au plafond', async () => {
    const f = ok();
    const onFallback = vi.fn();
    const ai = createAiProviders(
      { LLM_PROVIDER: 'groq', GROQ_API_KEY: 'k', AI_MAX_CALLS_PER_MONTH: '1' },
      { fetch: f, onFallback },
    );
    expect((await ai.llm.complete(request)).text).toBe('réponse groq');
    expect((await ai.llm.complete(request)).text).toBe('Got it: hi');
    expect(f).toHaveBeenCalledTimes(1);
    expect(onFallback).toHaveBeenCalledWith('cap', 'groq/openai/gpt-oss-20b');
  });

  it('un plafond invalide retombe sur la valeur par défaut', async () => {
    const f = ok();
    const ai = createAiProviders(
      { LLM_PROVIDER: 'groq', GROQ_API_KEY: 'k', AI_MAX_CALLS_PER_MONTH: 'beaucoup' },
      { fetch: f },
    );
    expect((await ai.llm.complete(request)).text).toBe('réponse groq');
  });

  it('transmet les réglages de nouvel essai', async () => {
    const f = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('quota', { status: 429 }))
      .mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] })),
      );
    const ai = createAiProviders(
      { LLM_PROVIDER: 'groq', GROQ_API_KEY: 'k' },
      { fetch: f, retry: { sleep: async () => {} } },
    );
    expect((await ai.llm.complete(request)).text).toBe('ok');
    expect(f).toHaveBeenCalledTimes(2);
  });
});
