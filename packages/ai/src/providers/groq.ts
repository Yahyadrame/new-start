import type {
  LlmProvider,
  LlmRequest,
  LlmResponse,
  SttProvider,
  SttRequest,
  SttResponse,
} from '../types.js';
import { post, requireKey, type ProviderOptions } from './http.js';

const BASE = 'https://api.groq.com/openai/v1';

/** Groq reconnaît le format par l'extension du nom de fichier, pas par le type MIME : `audio/webm;codecs=opus` donne `audio.webm`. */
export function fileName(mimeType: string): string {
  const subtype = mimeType.split(';')[0]?.split('/')[1]?.trim() ?? '';
  return `audio.${subtype === 'mpeg' ? 'mp3' : subtype || 'wav'}`;
}

export class GroqLlm implements LlmProvider {
  readonly name: string;
  private readonly o: Required<Omit<ProviderOptions, 'model'>> & { model: string };

  constructor(options: ProviderOptions) {
    this.o = {
      model: options.model ?? 'openai/gpt-oss-20b',
      fetch: options.fetch ?? fetch,
      timeoutMs: options.timeoutMs ?? 30_000,
      apiKey: requireKey('groq', options.apiKey),
    };
    this.name = `groq/${this.o.model}`;
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const res = await post({
      provider: 'groq',
      url: `${BASE}/chat/completions`,
      headers: { Authorization: `Bearer ${this.o.apiKey}` },
      body: JSON.stringify({
        model: this.o.model,
        messages: [{ role: 'system', content: request.system }, ...request.messages],
        ...(request.json ? { response_format: { type: 'json_object' } } : {}),
        max_completion_tokens: 1000,
        reasoning_effort: 'low',
      }),
      fetch: this.o.fetch,
      signal: request.signal,
      timeoutMs: this.o.timeoutMs,
    });
    const d = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const usage = d.usage && {
      inputTokens: d.usage.prompt_tokens ?? 0,
      outputTokens: d.usage.completion_tokens ?? 0,
    };
    return { text: d.choices?.[0]?.message?.content ?? '', ...(usage ? { usage } : {}) };
  }
}

export class GroqStt implements SttProvider {
  readonly name: string;
  private readonly o: Required<Omit<ProviderOptions, 'model'>> & { model: string };

  constructor(options: ProviderOptions) {
    this.o = {
      model: options.model ?? 'whisper-large-v3-turbo',
      fetch: options.fetch ?? fetch,
      timeoutMs: options.timeoutMs ?? 30_000,
      apiKey: requireKey('groq', options.apiKey),
    };
    this.name = `groq/${this.o.model}`;
  }

  async transcribe(request: SttRequest): Promise<SttResponse> {
    const form = new FormData();
    form.set('model', this.o.model);
    form.set('language', request.language ?? 'en');
    form.set('response_format', 'verbose_json');
    form.append('timestamp_granularities[]', 'word');
    form.set(
      'file',
      new Blob([request.audio], { type: request.mimeType }),
      fileName(request.mimeType),
    );
    const res = await post({
      provider: 'groq',
      url: `${BASE}/audio/transcriptions`,
      headers: { Authorization: `Bearer ${this.o.apiKey}` },
      body: form,
      fetch: this.o.fetch,
      signal: request.signal,
      timeoutMs: this.o.timeoutMs,
    });
    const d = (await res.json()) as {
      text?: string;
      words?: { word: string; start: number; end: number }[];
    };
    return { text: (d.text ?? '').trim(), ...(d.words ? { words: d.words } : {}) };
  }
}
