import { describe, expect, it, vi } from 'vitest';
import { ProgressService } from './progress.js';

describe('ProgressService.summary', () => {
  it('rend le niveau et l’avancement d’après l’XP de la personne', async () => {
    const stats = vi.fn().mockResolvedValue({ xp: 250, streakDays: 6 });
    expect(await new ProgressService({ stats }).summary('u1')).toEqual({
      xp: 250,
      level: 3,
      levelXp: 50,
      nextLevelXp: 100,
      streakDays: 6,
    });
    expect(stats).toHaveBeenCalledWith('u1');
  });

  it('compte un compte inconnu comme 0 XP', async () => {
    const service = new ProgressService({ stats: vi.fn().mockResolvedValue(null) });
    expect(await service.summary('u9')).toMatchObject({ xp: 0, level: 1 });
  });
});
