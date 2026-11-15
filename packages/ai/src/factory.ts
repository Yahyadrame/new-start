import { FakeLlm, FakeStt, FakeTts } from './fake.js';
import { GeminiLlm, GeminiTts } from './providers/gemini.js';
import { GroqLlm, GroqStt } from './providers/groq.js';
import type { FetchLike } from './providers/http.js';
import {
  reliableLlm,
  reliableStt,
  reliableTts,
  UsageCap,
  type FallbackOptions,
} from './fallback.js';
import type { RetryOptions } from './retry.js';
import type { LlmProvider, SttProvider, TtsProvider } from './types.js';

export type AiEnv = Record<string, string | undefined>;

export interface AiOptions {
  fetch?: FetchLike;
  retry?: RetryOptions;
  onFallback?: FallbackOptions['onFallback'];
  now?: () => Date;
}

export interface AiProviders {
  llm: LlmProvider;
  stt: SttProvider;
  tts: TtsProvider;
}

/** Plafond par défaut : prudent, pour que des crédits d'essai ne partent pas sur une boucle. */
const DEFAULT_MAX_CALLS = 2000;

function maxCalls(env: AiEnv): number {
  const n = Number(env.AI_MAX_CALLS_PER_MONTH);
  return env.AI_MAX_CALLS_PER_MONTH !== undefined && Number.isInteger(n) && n >= 0
    ? n
    : DEFAULT_MAX_CALLS;
}

/**
 * Choisit les fournisseurs d'après l'environnement : `LLM_PROVIDER` (groq, gemini), `STT_PROVIDER`
 * (groq), `TTS_PROVIDER` (gemini). Valeur vide, inconnue ou clé manquante : adaptateur factice.
 */
export function createAiProviders(env: AiEnv, options: AiOptions = {}): AiProviders {
  const base = options.fetch ? { fetch: options.fetch } : {};
  const groq = env.GROQ_API_KEY ? { apiKey: env.GROQ_API_KEY, ...base } : undefined;
  const gemini = env.GEMINI_API_KEY ? { apiKey: env.GEMINI_API_KEY, ...base } : undefined;
  const cap = new UsageCap(maxCalls(env), options.now);
  const guard: FallbackOptions = {
    cap,
    ...(options.retry ? { retry: options.retry } : {}),
    ...(options.onFallback ? { onFallback: options.onFallback } : {}),
  };

  const llmChoice = env.LLM_PROVIDER;
  const primaryLlm =
    llmChoice === 'groq' && groq
      ? new GroqLlm(groq)
      : llmChoice === 'gemini' && gemini
        ? new GeminiLlm(gemini)
        : undefined;
  const primaryStt = env.STT_PROVIDER === 'groq' && groq ? new GroqStt(groq) : undefined;
  const primaryTts = env.TTS_PROVIDER === 'gemini' && gemini ? new GeminiTts(gemini) : undefined;

  return {
    llm: primaryLlm ? reliableLlm(primaryLlm, new FakeLlm(), guard) : new FakeLlm(),
    stt: primaryStt ? reliableStt(primaryStt, new FakeStt(), guard) : new FakeStt(),
    tts: primaryTts ? reliableTts(primaryTts, new FakeTts(), guard) : new FakeTts(),
  };
}
