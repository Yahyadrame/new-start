import { pcmToWav } from '../metrics.js';
import type {
  LlmProvider,
  LlmRequest,
  LlmResponse,
  TtsProvider,
  TtsRequest,
  TtsResponse,
} from '../types.js';
import { post, ProviderError, requireKey, type ProviderOptions } from './http.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inlineData?: { data?: string };
}
interface GeminiReply {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
}

type Resolved = Required<Omit<ProviderOptions, 'model'>> & { model: string };

function resolve(options: ProviderOptions, defaultModel: string): Resolved {
  return {
    model: options.model ?? defaultModel,
    fetch: options.fetch ?? fetch,
    timeoutMs: options.timeoutMs ?? 30_000,
    apiKey: requireKey('gemini', options.apiKey),
  };
}

async function generate(o: Resolved, body: unknown, signal?: AbortSignal): Promise<GeminiReply> {
  const res = await post({
    provider: 'gemini',
    url: `${BASE}/${o.model}:generateContent`,
    headers: { 'x-goog-api-key': o.apiKey },
    body: JSON.stringify(body),
    fetch: o.fetch,
    signal,
    timeoutMs: o.timeoutMs,
  });
  return (await res.json()) as GeminiReply;
}

export class GeminiLlm implements LlmProvider {
  readonly name: string;
  private readonly o: Resolved;

  constructor(options: ProviderOptions) {
    this.o = resolve(options, 'gemini-3.5-flash-lite');
    this.name = `gemini/${this.o.model}`;
  }

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const d = await generate(
      this.o,
      {
        systemInstruction: { parts: [{ text: request.system }] },
        contents: request.messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: 400,
          ...(request.json ? { responseMimeType: 'application/json' } : {}),
        },
      },
      request.signal,
    );
    const u = d.usageMetadata;
    const usage = u && {
      inputTokens: u.promptTokenCount ?? 0,
      outputTokens: u.candidatesTokenCount ?? 0,
    };
    return {
      text: d.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      ...(usage ? { usage } : {}),
    };
  }
}

export class GeminiTts implements TtsProvider {
  readonly name: string;
  private readonly o: Resolved;

  constructor(options: ProviderOptions) {
    this.o = resolve(options, 'gemini-2.5-flash-preview-tts');
    this.name = `gemini/${this.o.model}`;
  }

  async synthesize(request: TtsRequest): Promise<TtsResponse> {
    const d = await generate(
      this.o,
      {
        contents: [{ parts: [{ text: request.text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: request.voice ?? 'Kore' } },
          },
        },
      },
      request.signal,
    );
    const b64 = d.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!b64) throw new ProviderError('gemini', 502, 'réponse sans audio');
    return { audio: pcmToWav(Buffer.from(b64, 'base64')), mimeType: 'audio/wav' };
  }
}
