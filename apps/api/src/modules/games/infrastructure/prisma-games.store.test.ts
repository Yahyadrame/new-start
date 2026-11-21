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

  describe('défi du jour', () => {
    const now = new Date('2026-11-21T23:30:00Z');

    it('donne le jour dans le fuseau de la personne et l’état du défi', async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue({ timezone: 'Asia/Tokyo' }) },
        dailyActivity: { findUnique: vi.fn().mockResolvedValue({ challengeDone: true }) },
      };
      const store = new PrismaGamesStore(db as unknown as PrismaService);
      expect(await store.today('u1', now)).toEqual({ day: '2026-11-22', done: true });
      expect(db.dailyActivity.findUnique.mock.calls[0]?.[0].where).toEqual({
        userId_day: { userId: 'u1', day: new Date('2026-11-22T00:00:00Z') },
      });
    });

    it('prend UTC et « pas fait » sans compte ni ligne du jour', async () => {
      const db = {
        user: { findUnique: vi.fn().mockResolvedValue(null) },
        dailyActivity: { findUnique: vi.fn().mockResolvedValue(null) },
      };
      const store = new PrismaGamesStore(db as unknown as PrismaService);
      expect(await store.today('u1', now)).toEqual({ day: '2026-11-21', done: false });
    });

    it.each([
      [1, true],
      [0, false],
    ])('marque le défi terminé (%i ligne changée) et rend %s', async (count, expected) => {
      const db = {
        dailyActivity: {
          upsert: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({ count }),
        },
      };
      const store = new PrismaGamesStore(db as unknown as PrismaService);
      expect(await store.claimChallenge('u1', '2026-11-21')).toBe(expected);
      const day = new Date('2026-11-21T00:00:00Z');
      expect(db.dailyActivity.upsert.mock.calls[0]?.[0].create).toEqual({ userId: 'u1', day });
      expect(db.dailyActivity.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', day, challengeDone: false },
        data: { challengeDone: true },
      });
    });
  });
});
