import { type DayActivity, type ProgressSummary, summarize } from '@newstart/shared';

export const PROGRESS_STORE = Symbol('PROGRESS_STORE');

export interface ProgressStore {
  /**
   * XP total, série de jours, jour local d'aujourd'hui et activité des 7 derniers jours,
   * ou null si le compte n'existe pas.
   */
  stats(userId: string): Promise<{
    xp: number;
    streakDays: number;
    today: string;
    activity: DayActivity[];
  } | null>;
}

export class ProgressService {
  constructor(private readonly store: ProgressStore) {}

  /** Niveau et XP ; un compte inconnu compte comme 0 XP. */
  async summary(userId: string): Promise<ProgressSummary> {
    const stats = await this.store.stats(userId);
    return summarize(stats?.xp ?? 0, stats?.streakDays ?? 0, stats?.activity, stats?.today);
  }
}
