import type {
  LlmProvider,
  LlmRequest,
  LlmResponse,
  SttProvider,
  SttRequest,
  SttResponse,
  TtsProvider,
  TtsRequest,
  TtsResponse,
} from './types.js';

/** Adaptateur factice : sans réseau, sans clé, réponses prévisibles. Sert aux tests et de repli quand le plafond de crédits est atteint. */
export class FakeLlm implements LlmProvider {
  readonly name = 'fake';

  async complete(request: LlmRequest): Promise<LlmResponse> {
    const last = request.messages.at(-1)?.content ?? '';
    const reply = `Got it: ${last}`;
    return { text: request.json ? JSON.stringify({ reply, fix: null }) : reply };
  }
}

export class FakeStt implements SttProvider {
  readonly name = 'fake';

  async transcribe(request: SttRequest): Promise<SttResponse> {
    const text = `audio of ${request.audio.byteLength} bytes`;
    const words = text.split(' ').map((word, i) => ({ word, start: i * 0.5, end: i * 0.5 + 0.5 }));
    return { text, words };
  }
}

export class FakeTts implements TtsProvider {
  readonly name = 'fake';

  async synthesize(request: TtsRequest): Promise<TtsResponse> {
    return { audio: new TextEncoder().encode(request.text), mimeType: 'audio/fake' };
  }
}
