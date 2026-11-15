import { describe, expect, it, vi } from 'vitest';
import { GeminiLlm, GeminiTts } from './gemini.js';
import { GroqLlm, GroqStt } from './groq.js';
import { ProviderError } from './http.js';

const KEY = 'secret-key-123';

function reply(body: unknown, status = 200): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
}

function mockFetch(res: Response) {
  return vi.fn<typeof fetch>(async () => res);
}

function call(f: ReturnType<typeof mockFetch>) {
  const [url, init] = f.mock.calls[0] ?? [];
  return { url: String(url), init: init ?? {} };
}

const request = { system: 'sys', messages: [{ role: 'user' as const, content: 'hi' }] };

describe('GroqLlm', () => {
  it('envoie le message et renvoie texte et usage', async () => {
    const f = mockFetch(
      reply({
        choices: [{ message: { content: '{"reply":"ok","fix":null}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    );
    const llm = new GroqLlm({ apiKey: KEY, fetch: f });
    const out = await llm.complete({ ...request, json: true });
    expect(out).toEqual({
      text: '{"reply":"ok","fix":null}',
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    const { url, init } = call(f);
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('openai/gpt-oss-20b');
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sys' });
    expect(llm.name).toBe('groq/openai/gpt-oss-20b');
  });

  it('ne demande pas de JSON par défaut et tolère une réponse vide', async () => {
    const f = mockFetch(reply({}));
    const out = await new GroqLlm({ apiKey: KEY, fetch: f, model: 'autre' }).complete(request);
    expect(out).toEqual({ text: '' });
    expect(JSON.parse(String(call(f).init.body)).response_format).toBeUndefined();
  });

  it('refuse de démarrer sans clé', () => {
    expect(() => new GroqLlm({ apiKey: '' })).toThrow('clé');
  });

  it('transforme un statut en erreur sans exposer la clé', async () => {
    const llm = new GroqLlm({ apiKey: KEY, fetch: mockFetch(reply('quota', 429)) });
    const err = await llm.complete(request).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProviderError);
    const e = err as ProviderError;
    expect(e.status).toBe(429);
    expect(e.retryable).toBe(true);
    expect(e.message).not.toContain(KEY);
  });

  it('ne réessaie pas une erreur 400 mais réessaie une 503', async () => {
    const make = (s: number) =>
      new GroqLlm({ apiKey: KEY, fetch: mockFetch(reply('x', s)) }).complete(request);
    expect(((await make(400).catch((e) => e)) as ProviderError).retryable).toBe(false);
    expect(((await make(503).catch((e) => e)) as ProviderError).retryable).toBe(true);
  });

  it("transmet le signal d'annulation", async () => {
    const f = vi.fn<typeof fetch>(async (_u, init) => {
      if (init?.signal?.aborted) throw new Error('annulé');
      return reply({});
    });
    const ctrl = new AbortController();
    ctrl.abort();
    await expect(
      new GroqLlm({ apiKey: KEY, fetch: f }).complete({ ...request, signal: ctrl.signal }),
    ).rejects.toThrow('annulé');
  });
});

describe('GroqStt', () => {
  it('envoie le fichier et renvoie texte et mots', async () => {
    const f = mockFetch(
      reply({ text: ' hello there ', words: [{ word: 'hello', start: 0, end: 0.4 }] }),
    );
    const stt = new GroqStt({ apiKey: KEY, fetch: f });
    const out = await stt.transcribe({ audio: new Uint8Array([1, 2]), mimeType: 'audio/wav' });
    expect(out.text).toBe('hello there');
    expect(out.words).toHaveLength(1);
    const { url, init } = call(f);
    expect(url).toContain('/audio/transcriptions');
    const form = init.body as FormData;
    expect(form.get('model')).toBe('whisper-large-v3-turbo');
    expect(form.get('language')).toBe('en');
    expect(form.get('file')).toBeInstanceOf(Blob);
  });

  it('accepte une réponse sans mots et une autre langue', async () => {
    const f = mockFetch(reply({ text: 'salut' }));
    const out = await new GroqStt({ apiKey: KEY, fetch: f }).transcribe({
      audio: new Uint8Array(),
      mimeType: 'audio/webm',
      language: 'fr',
    });
    expect(out).toEqual({ text: 'salut' });
    expect((call(f).init.body as FormData).get('language')).toBe('fr');
  });
});

describe('GeminiLlm', () => {
  it("convertit les rôles et lit le texte et l'usage", async () => {
    const f = mockFetch(
      reply({
        candidates: [{ content: { parts: [{ text: 'hey' }] } }],
        usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 3 },
      }),
    );
    const llm = new GeminiLlm({ apiKey: KEY, fetch: f });
    const out = await llm.complete({
      system: 'sys',
      json: true,
      messages: [
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
      ],
    });
    expect(out).toEqual({ text: 'hey', usage: { inputTokens: 7, outputTokens: 3 } });
    const { url, init } = call(f);
    expect(url).toContain('gemini-3.5-flash-lite:generateContent');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    const body = JSON.parse(String(init.body));
    expect(body.contents.map((c: { role: string }) => c.role)).toEqual(['user', 'model']);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(llm.name).toBe('gemini/gemini-3.5-flash-lite');
  });

  it("renvoie un texte vide quand il n'y a aucun candidat", async () => {
    const out = await new GeminiLlm({ apiKey: KEY, fetch: mockFetch(reply({})) }).complete(request);
    expect(out).toEqual({ text: '' });
  });
});

describe('GeminiTts', () => {
  const pcm = Buffer.from(new Uint8Array(480)).toString('base64');

  it('renvoie un WAV avec la voix demandée', async () => {
    const f = mockFetch(
      reply({ candidates: [{ content: { parts: [{ inlineData: { data: pcm } }] } }] }),
    );
    const out = await new GeminiTts({ apiKey: KEY, fetch: f }).synthesize({
      text: 'hi',
      voice: 'Puck',
    });
    expect(out.mimeType).toBe('audio/wav');
    expect(new TextDecoder().decode(out.audio.slice(0, 4))).toBe('RIFF');
    const body = JSON.parse(String(call(f).init.body));
    expect(body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(
      'Puck',
    );
  });

  it('prend la voix Kore par défaut', async () => {
    const f = mockFetch(
      reply({ candidates: [{ content: { parts: [{ inlineData: { data: pcm } }] } }] }),
    );
    await new GeminiTts({ apiKey: KEY, fetch: f }).synthesize({ text: 'hi' });
    expect(String(call(f).init.body)).toContain('Kore');
  });

  it("échoue quand la réponse ne contient pas d'audio", async () => {
    const tts = new GeminiTts({ apiKey: KEY, fetch: mockFetch(reply({ candidates: [] })) });
    await expect(tts.synthesize({ text: 'hi' })).rejects.toBeInstanceOf(ProviderError);
  });
});
