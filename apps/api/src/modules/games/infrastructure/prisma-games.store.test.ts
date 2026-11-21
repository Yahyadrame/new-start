import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { PrismaGamesStore } from './prisma-games.store.js';

describe('PrismaGamesStore', () => {
  it('lit les expressions du noyau avec leur sens et leur semaine', async () => {
    const rows = [{ id: 1, text: 'You know', meaningFr: 'tu sais', week: 1 }];
    const db = { expression: { findMany: vi.fn().mockResolvedValue(rows) } };
    const store = new PrismaGamesStore(db as unknown as PrismaService);
    expect(await store.expressions()).toEqual(rows);
    expect(db.expression.findMany.mock.calls[0]?.[0].select).toEqual({
      id: true,
      text: true,
      meaningFr: true,
      week: true,
    });
  });

  it('ajoute l’XP à la personne et rend son total', async () => {
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({ xp: 40 }),
      },
    };
    const store = new PrismaGamesStore(db as unknown as PrismaService);
    expect(await store.addXp('u1', 15)).toBe(40);
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { xp: { increment: 15 } },
      select: { xp: true },
    });
  });

  it('met aussi à jour la série de jours', async () => {
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          streakDays: 2,
          lastActiveDay: null,
          timezone: 'Africa/Dakar',
          pausedUntil: null,
        }),
        update: vi.fn().mockResolvedValue({ xp: 15 }),
      },
      dailyActivity: { upsert: vi.fn().mockResolvedValue({}) },
    };
    await new PrismaGamesStore(db as unknown as PrismaService).addXp('u1', 15);
    expect(db.user.update.mock.calls[0]?.[0].data).toMatchObject({
      xp: { increment: 15 },
      streakDays: 1,
    });
    const upsert = db.dailyActivity.upsert.mock.calls[0]?.[0];
    expect(upsert.create).toMatchObject({ userId: 'u1', gamesPlayed: 1, xpEarned: 15 });
  });
});
