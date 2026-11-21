import type { ProgressSummary } from '@newstart/shared';

export class ProgressError extends Error {
  constructor(readonly status: number) {
    super(`progress ${status}`);
  }
}

/** Niveau et XP de la personne connectée. */
export async function fetchProgress(token: string): Promise<ProgressSummary> {
  const res = await fetch('/api/progress', { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new ProgressError(res.status);
  return (await res.json()) as ProgressSummary;
}
