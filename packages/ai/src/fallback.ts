import { ProviderError } from './providers/http.js';
import { isTransientOrBadAudio, withRetry, type RetryOptions } from './retry.js';
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

/**
 * Compte les appels payants du mois en cours. En mémoire : il repart de zéro au redémarrage.
 * ponytail: compteur par processus, à persister en base quand l'API tourne sur plusieurs instances.
 */
export class UsageCap {
  private used = 0;
  private month: string;

  constructor(
    readonly maxCallsPerMonth: number,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.month = this.monthKey();
  }

  private monthKey(): string {
    return this.now().toISOString().slice(0, 7);
  }

  /** Réserve un appel ; faux quand le plafond du mois est atteint. */
  take(): boolean {
    const key = this.monthKey();
    if (key !== this.month) {
      this.month = key;
      this.used = 0;
    }
    if (this.used >= this.maxCallsPerMonth) return false;
    this.used++;
    return true;
  }
}

export interface FallbackOptions {
  cap: UsageCap;
  retry?: RetryOptions;
  /** Appelé à chaque repli, avec la raison ; ne reçoit jamais le contenu de la demande. */
  onFallback?: (reason: 'cap' | 'error', provider: string) => void;
}

/** Quota épuisé chez le fournisseur : inutile d'insister, on passe au factice. */
function quotaExhausted(error: unknown): boolean {
  return error instanceof ProviderError && (error.status === 429 || error.status >= 500);
}

async function guarded<T>(
  name: string,
  o: FallbackOptions,
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  if (!o.cap.take()) {
    o.onFallback?.('cap', name);
    return fallback();
  }
  try {
    return await withRetry(primary, o.retry);
  } catch (error) {
    if (!quotaExhausted(error)) throw error;
    o.onFallback?.('error', name);
    return fallback();
  }
}

export function reliableLlm(
  primary: LlmProvider,
  fallback: LlmProvider,
  o: FallbackOptions,
): LlmProvider {
  return {
    name: primary.name,
    complete: (r: LlmRequest): Promise<LlmResponse> =>
      guarded(
        primary.name,
        o,
        () => primary.complete(r),
        () => fallback.complete(r),
      ),
  };
}

export function reliableStt(
  primary: SttProvider,
  fallback: SttProvider,
  o: FallbackOptions,
): SttProvider {
  return {
    name: primary.name,
    transcribe: (r: SttRequest): Promise<SttResponse> =>
      guarded(
        primary.name,
        o,
        () => primary.transcribe(r),
        () => fallback.transcribe(r),
      ),
  };
}

export function reliableTts(
  primary: TtsProvider,
  fallback: TtsProvider,
  o: FallbackOptions,
): TtsProvider {
  const retry = { retryOn: isTransientOrBadAudio, ...o.retry };
  return {
    name: primary.name,
    synthesize: (r: TtsRequest): Promise<TtsResponse> =>
      guarded(
        primary.name,
        { ...o, retry },
        () => primary.synthesize(r),
        () => fallback.synthesize(r),
      ),
  };
}
