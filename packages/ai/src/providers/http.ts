export type FetchLike = typeof fetch;

/** Erreur d'un fournisseur : jamais la clé ni le contenu envoyé, seulement le statut et le début de sa réponse. */
export class ProviderError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    detail: string,
  ) {
    super(`${provider}: HTTP ${status} ${detail}`.trim());
    this.name = 'ProviderError';
  }

  /** Quota atteint ou panne passagère : un nouvel essai peut réussir. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export interface PostOptions {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: string | FormData;
  fetch: FetchLike;
  signal?: AbortSignal | undefined;
  timeoutMs: number;
}

export async function post(o: PostOptions): Promise<Response> {
  const timeout = AbortSignal.timeout(o.timeoutMs);
  const signal = o.signal ? AbortSignal.any([o.signal, timeout]) : timeout;
  const headers =
    typeof o.body === 'string' ? { 'Content-Type': 'application/json', ...o.headers } : o.headers;
  const res = await o.fetch(o.url, { method: 'POST', headers, body: o.body, signal });
  if (!res.ok) throw new ProviderError(o.provider, res.status, (await res.text()).slice(0, 120));
  return res;
}

export interface ProviderOptions {
  apiKey: string;
  model?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
}

export function requireKey(provider: string, apiKey: string): string {
  if (!apiKey) throw new Error(`${provider}: clé d'API manquante`);
  return apiKey;
}
