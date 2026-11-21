import { type ProgressSummary, summarize } from '@newstart/shared';

export const PROGRESS_STORE = Symbol('PROGRESS_STORE');

export interface ProgressStore {
  /** XP total et série de jours en cours, ou null si le compte n'existe pas. */
  stats(userId: string): Promise<{ xp: number; streakDays: number } | null>;
}

export class ProgressService {
  constructor(private readonly store: ProgressStore) {}

  /** Niveau et XP ; un compte inconnu compte comme 0 XP. */
  async summary(userId: string): Promise<ProgressSummary> {
    const stats = await this.store.stats(userId);
    return summarize(stats?.xp ?? 0, stats?.streakDays ?? 0);
  }
}
