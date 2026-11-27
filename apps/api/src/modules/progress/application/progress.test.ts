import { describe, expect, it, vi } from 'vitest';
import { ProgressService } from './progress.js';

describe('ProgressService.summary', () => {
  it('rend le niveau et l’avancement d’après l’XP de la personne', async () => {
    const stats = vi.fn().mockResolvedValue({
      xp: 250,
      streakDays: 6,
      today: '2026-11-21',
      activity: [
        {
          day: '2026-11-21',
          spokenSeconds: 120,
          messagesSent: 5,
          voiceSent: 0,
          photosSent: 0,
          gamesPlayed: 1,
          xpEarned: 55,
        },
      ],
    });
    const summary = await new ProgressService({ stats }).summary('u1');
    expect(summary).toMatchObject({
      xp: 250,
      level: 3,
      levelXp: 50,
      nextLevelXp: 100,
      streakDays: 6,
      figures: { messages: 5, games: 1, weekXp: 55, activeDays: 1 },
    });
    expect(summary.week[6]).toEqual({ day: '2026-11-21', minutes: 2 });
    expect(stats).toHaveBeenCalledWith('u1');
  });

  it('compte un compte inconnu comme 0 XP', async () => {
    const service = new ProgressService({ stats: vi.fn().mockResolvedValue(null) });
    expect(await service.summary('u9')).toMatchObject({ xp: 0, level: 1 });
  });
});
