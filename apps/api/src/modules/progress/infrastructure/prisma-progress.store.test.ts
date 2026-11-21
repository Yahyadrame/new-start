import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaProgressStore } from './prisma-progress.store.js';

const now = new Date('2026-11-21T10:00:00Z');
const user = (over: Record<string, unknown> = {}) => ({
  xp: 40,
  streakDays: 4,
  lastActiveDay: new Date('2026-11-20T00:00:00Z'),
  timezone: 'Africa/Dakar',
  pausedUntil: null,
  ...over,
});
const store = (found: unknown, rows: unknown[] = []) => {
  const findUnique = vi.fn().mockResolvedValue(found);
  const findMany = vi.fn().mockResolvedValue(rows);
  return {
    findUnique,
    findMany,
    store: new PrismaProgressStore({
      user: { findUnique },
      dailyActivity: { findMany },
    } as unknown as PrismaService),
  };
};

describe('PrismaProgressStore.stats', () => {
  it('lit l’XP et la série du compte', async () => {
    const s = store(user());
    expect(await s.store.stats('u1', now)).toEqual({
      xp: 40,
      streakDays: 4,
      today: '2026-11-21',
      activity: [],
    });
    expect(s.findUnique.mock.calls[0]?.[0].where).toEqual({ id: 'u1' });
  });

  it('lit l’activité des 7 derniers jours du compte', async () => {
    const row = {
      day: new Date('2026-11-20T00:00:00Z'),
      spokenSeconds: 0,
      messagesSent: 3,
      gamesPlayed: 1,
      xpEarned: 35,
    };
    const s = store(user(), [row]);
    const out = await s.store.stats('u1', now);
    expect(out?.activity).toEqual([{ ...row, day: '2026-11-20' }]);
    expect(s.findMany.mock.calls[0]?.[0].where).toEqual({
      userId: 'u1',
      day: { gte: new Date('2026-11-15T00:00:00Z') },
    });
  });

  it('remet la série à 0 quand elle est rompue', async () => {
    const old = user({ lastActiveDay: new Date('2026-11-15T00:00:00Z') });
    expect(await store(old).store.stats('u1', now)).toMatchObject({ xp: 40, streakDays: 0 });
  });

  it('garde la série en mode pause', async () => {
    const paused = user({
      lastActiveDay: new Date('2026-11-15T00:00:00Z'),
      pausedUntil: new Date('2026-11-25T00:00:00Z'),
    });
    expect(await store(paused).store.stats('u1', now)).toMatchObject({ streakDays: 4 });
  });

  it('rend null pour un compte inconnu', async () => {
    expect(await store(null).store.stats('u9', now)).toBeNull();
  });
});
