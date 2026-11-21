import { describe, expect, it, vi } from 'vitest';
import { ProgressService } from './progress.js';

describe('ProgressService.summary', () => {
  it('rend le niveau et l’avancement d’après l’XP de la personne', async () => {
    const xp = vi.fn().mockResolvedValue(250);
    expect(await new ProgressService({ xp }).summary('u1')).toEqual({
      xp: 250,
      level: 3,
      levelXp: 50,
      nextLevelXp: 100,
    });
    expect(xp).toHaveBeenCalledWith('u1');
  });

  it('compte un compte inconnu comme 0 XP', async () => {
    const service = new ProgressService({ xp: vi.fn().mockResolvedValue(null) });
    expect(await service.summary('u9')).toMatchObject({ xp: 0, level: 1 });
  });
});
