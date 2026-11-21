import { type ProgressSummary, summarize } from '@newstart/shared';

export const PROGRESS_STORE = Symbol('PROGRESS_STORE');

export interface ProgressStore {
  /** Total d'XP de la personne, ou null si le compte n'existe pas. */
  xp(userId: string): Promise<number | null>;
}

export class ProgressService {
  constructor(private readonly store: ProgressStore) {}

  /** Niveau et XP ; un compte inconnu compte comme 0 XP. */
  async summary(userId: string): Promise<ProgressSummary> {
    return summarize((await this.store.xp(userId)) ?? 0);
  }
}
