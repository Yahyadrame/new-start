import { describe, expect, it } from 'vitest';
import { ProgressSummary, summarize } from './progress.js';

describe('summarize', () => {
  it('démarre au niveau 1 sans XP', () => {
    expect(summarize(0)).toEqual({ xp: 0, level: 1, levelXp: 0, nextLevelXp: 100, streakDays: 0 });
  });

  it('reste dans le niveau tant que le palier n’est pas atteint', () => {
    expect(summarize(99)).toMatchObject({ level: 1, levelXp: 99 });
  });

  it('passe au niveau suivant au palier et garde le reste', () => {
    expect(summarize(100)).toMatchObject({ level: 2, levelXp: 0 });
    expect(summarize(250)).toMatchObject({ level: 3, levelXp: 50 });
  });

  it('reprend la série de jours donnée', () => {
    expect(summarize(10, 6).streakDays).toBe(6);
  });

  it('rend un résumé valide pour le schéma', () => {
    expect(ProgressSummary.safeParse(summarize(1234)).success).toBe(true);
  });
});
