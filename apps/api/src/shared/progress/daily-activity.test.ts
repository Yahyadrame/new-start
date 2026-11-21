import { describe, expect, it, vi } from 'vitest';
import { recordActivity } from './daily-activity.js';

describe('recordActivity', () => {
  it('crée la ligne du jour ou y ajoute les compteurs', () => {
    const upsert = vi.fn().mockReturnValue('query');
    const day = new Date('2026-11-21T00:00:00Z');
    const out = recordActivity({ dailyActivity: { upsert } } as never, 'u1', day, {
      messagesSent: 1,
      xpEarned: 10,
    });
    expect(out).toBe('query');
    expect(upsert).toHaveBeenCalledWith({
      where: { userId_day: { userId: 'u1', day } },
      create: { userId: 'u1', day, messagesSent: 1, xpEarned: 10 },
      update: { messagesSent: { increment: 1 }, xpEarned: { increment: 10 } },
    });
  });
});
