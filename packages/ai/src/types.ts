/** Interfaces des trois briques IA (docs/09-ia-agents.md). Chaque fournisseur en implémente une. */

export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LlmRequest {
  system: string;
  messages: LlmMessage[];
  /** Demande une sortie JSON seule, à valider ensuite avec Zod. */
  json?: boolean;
  signal?: AbortSignal;
}

export interface LlmResponse {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface LlmProvider {
  readonly name: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export interface SttRequest {
  audio: Uint8Array;
  /** Type MIME de l'audio, par exemple `audio/webm`. */
  mimeType: string;
  /** Code de langue ISO 639-1, `en` par défaut. */
  language?: string;
  signal?: AbortSignal;
}

export interface SttWord {
  word: string;
  /** Secondes depuis le début de l'audio. */
  start: number;
  end: number;
}

export interface SttResponse {
  text: string;
  words?: SttWord[];
}

export interface SttProvider {
  readonly name: string;
  transcribe(request: SttRequest): Promise<SttResponse>;
}

export interface TtsRequest {
  text: string;
  /** Nom de voix propre au fournisseur ; il reste stable pour un même personnage. */
  voice?: string;
  signal?: AbortSignal;
}

export interface TtsResponse {
  audio: Uint8Array;
  mimeType: string;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(request: TtsRequest): Promise<TtsResponse>;
}
