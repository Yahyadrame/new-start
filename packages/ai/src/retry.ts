import { ProviderError } from './providers/http.js';

export interface RetryOptions {
  /** Nombre de nouveaux essais après le premier appel. */
  retries?: number;
  /** Attente avant le premier nouvel essai ; elle double à chaque fois. */
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  retryOn?: (error: unknown) => boolean;
}

/** Quota atteint (429), panne passagère (5xx) ou délai dépassé : un nouvel essai peut réussir. */
export function isTransient(error: unknown): boolean {
  if (error instanceof ProviderError) return error.retryable;
  return error instanceof Error && error.name === 'TimeoutError';
}

/** Gemini TTS répond parfois 400 « texte au lieu d'audio » : un nouvel essai passe le plus souvent. */
export function isTransientOrBadAudio(error: unknown): boolean {
  return isTransient(error) || (error instanceof ProviderError && error.status === 400);
}

export async function withRetry<T>(fn: () => Promise<T>, o: RetryOptions = {}): Promise<T> {
  const { retries = 2, delayMs = 500, retryOn = isTransient } = o;
  const sleep = o.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !retryOn(error)) throw error;
      await sleep(delayMs * 2 ** attempt);
    }
  }
}
