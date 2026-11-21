import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { localDay, nextStreak, streakUpdate } from './streak.js';

const state = (over: Partial<Parameters<typeof nextStreak>[0]> = {}) => ({
  streakDays: 4,
  lastActiveDay: '2026-11-20',
  paused: false,
  ...over,
});

describe('localDay', () => {
  it('compte le jour dans le fuseau de la personne', () => {
    const now = new Date('2026-11-21T23:30:00Z');
    expect(localDay(now, 'Africa/Dakar')).toBe('2026-11-21');
    expect(localDay(now, 'Asia/Tokyo')).toBe('2026-11-22');
  });
});

describe('nextStreak', () => {
  it('ne change rien si le jour est déjà compté', () => {
    expect(nextStreak(state({ lastActiveDay: '2026-11-21' }), '2026-11-21')).toBe(4);
  });

  it('ajoute un jour quand la dernière activité date d’hier', () => {
    expect(nextStreak(state(), '2026-11-21')).toBe(5);
  });

  it('passe d’un mois à l’autre', () => {
    expect(nextStreak(state({ lastActiveDay: '2026-11-30' }), '2026-12-01')).toBe(5);
  });

  it('repart à 1 après un jour manqué ou sans activité passée', () => {
    expect(nextStreak(state({ lastActiveDay: '2026-11-18' }), '2026-11-21')).toBe(1);
    expect(nextStreak(state({ streakDays: 0, lastActiveDay: null }), '2026-11-21')).toBe(1);
  });

  it('gèle la série en mode pause', () => {
    expect(nextStreak(state({ lastActiveDay: '2026-11-18', paused: true }), '2026-11-21')).toBe(4);
  });
});

describe('streakUpdate', () => {
  const dbWith = (user: unknown) =>
    ({ user: { findUnique: vi.fn().mockResolvedValue(user) } }) as unknown as PrismaService;
  const now = new Date('2026-11-21T10:00:00Z');

  it('rend la série et le jour à écrire', async () => {
    const db = dbWith({
      streakDays: 4,
      lastActiveDay: new Date('2026-11-20T00:00:00Z'),
      timezone: 'Africa/Dakar',
      pausedUntil: null,
    });
    expect(await streakUpdate(db, 'u1', now)).toEqual({
      streakDays: 5,
      lastActiveDay: new Date('2026-11-21T00:00:00Z'),
    });
  });

  it('gèle la série tant que la pause court', async () => {
    const db = dbWith({
      streakDays: 4,
      lastActiveDay: new Date('2026-11-10T00:00:00Z'),
      timezone: 'Africa/Dakar',
      pausedUntil: new Date('2026-11-25T00:00:00Z'),
    });
    expect(await streakUpdate(db, 'u1', now)).toMatchObject({ streakDays: 4 });
  });

  it('ne rend rien pour un compte inconnu', async () => {
    expect(await streakUpdate(dbWith(null), 'u9', now)).toEqual({});
  });
});
