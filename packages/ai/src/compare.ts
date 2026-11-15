import { parseAgentReply } from './agent.js';
import { normalize, percentile } from './metrics.js';

export interface Sentence {
  level: string;
  text: string;
  /** Message corrigé attendu, ou null quand la phrase de l'élève est juste. */
  expected: string | null;
}

export interface Timed<T> {
  ms: number;
  value?: T;
  error?: string;
}

/** Mesure la durée d'un appel ; une erreur est notée (200 caractères au plus), pas relancée. */
export async function timed<T>(
  fn: () => Promise<T>,
  now = () => performance.now(),
): Promise<Timed<T>> {
  const t = now();
  try {
    const value = await fn();
    return { ms: Math.round(now() - t), value };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ms: Math.round(now() - t), error: message.slice(0, 200) };
  }
}

export interface LlmJudgement {
  validJson: boolean;
  fixed: boolean;
  exact: boolean;
}

/** Note la réponse brute d'un LLM : JSON valide, correction proposée, correction identique à l'attendue. */
export function judgeLlm(raw: string, sentence: Sentence): LlmJudgement {
  const parsed = parseAgentReply(raw);
  const better = parsed?.fix?.better ?? null;
  const fixed = better !== null;
  const exact =
    sentence.expected === null
      ? !fixed
      : fixed && normalize(better) === normalize(sentence.expected);
  return { validJson: parsed !== null, fixed, exact };
}

export interface CallRow {
  ms: number;
  error: string | undefined;
}

export function summarizeCalls(rows: CallRow[]) {
  const ok = rows.filter((r) => !r.error);
  const ms = ok.map((r) => r.ms);
  return {
    calls: rows.length,
    errors: rows.length - ok.length,
    p50ms: percentile(ms, 50),
    p95ms: percentile(ms, 95),
    firstError: rows.find((r) => r.error)?.error,
  };
}

export interface LlmRow extends CallRow {
  expected: string | null;
  judgement: LlmJudgement | undefined;
}

export function summarizeLlm(rows: LlmRow[]) {
  const ok = rows.filter((r) => r.judgement !== undefined);
  const count = (f: (r: LlmRow, j: LlmJudgement) => boolean) =>
    ok.filter((r) => r.judgement && f(r, r.judgement)).length;
  return {
    ...summarizeCalls(rows),
    validJson: count((_, j) => j.validJson),
    exactCorrections: count((_, j) => j.exact),
    falseAlarms: count((r, j) => r.expected === null && j.fixed),
    missed: count((r, j) => r.expected !== null && !j.fixed),
  };
}

export function meanWer(values: number[]): number | null {
  return values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3) : null;
}
